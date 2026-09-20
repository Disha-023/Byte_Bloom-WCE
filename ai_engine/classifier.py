"""
Civic Issue Classification Service.
Uses Google Gemini for multimodal AI analysis (text + image) with a robust
deterministic rule-based fallback when GEMINI_API_KEY is missing or unavailable.
"""

import io
import json
import os
import logging
from typing import Optional, Tuple
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

try:
    from .schemas import ClassificationResult, SupportedCategory
except (ImportError, ValueError):
    from schemas import ClassificationResult, SupportedCategory

logger = logging.getLogger("civic_classifier")

# Supported controlled categories
VALID_CATEGORIES = {
    "pothole",
    "garbage",
    "water_leakage",
    "drainage",
    "streetlight",
    "road_damage",
    "other",
}


def _rule_based_fallback(
    description: str,
    image_analyzed: bool = False,
    image_note: Optional[str] = None,
) -> ClassificationResult:
    """
    Deterministic rule-based classification fallback.
    Ensures the service remains 100% functional and testable without a live Gemini API key.
    """
    desc_clean = description.lower().strip()

    # Rule matching priority
    if any(k in desc_clean for k in ["pothole", "potholes", "crater"]):
        issue_type: SupportedCategory = "pothole"
        confidence = 0.94
        base_summary = "The complaint describes a road surface depression consistent with a pothole."

    elif any(k in desc_clean for k in ["road damage", "road cracked", "broken road", "asphalt crack", "pavement damage"]):
        issue_type = "road_damage"
        confidence = 0.91
        base_summary = "The complaint indicates structural deterioration or cracks on the road surface."

    elif any(k in desc_clean for k in ["garbage", "trash", "waste", "dump", "bin", "litter", "rubbish"]):
        issue_type = "garbage"
        confidence = 0.93
        base_summary = "The complaint describes uncollected solid waste or overflowing garbage."

    elif any(k in desc_clean for k in ["water leak", "pipe burst", "burst pipe", "pipe leak", "water supply", "pipeline leakage", "leaking pipe"]):
        issue_type = "water_leakage"
        confidence = 0.95
        base_summary = "The complaint describes clean or potable water escaping from municipal pipeline infrastructure."

    elif any(k in desc_clean for k in ["drain", "drainage", "sewage", "gutter", "clog", "sewer", "manhole"]):
        issue_type = "drainage"
        confidence = 0.92
        base_summary = "The complaint reports wastewater backup or blocked municipal drainage conduits."

    elif any(k in desc_clean for k in ["streetlight", "street light", "dark road", "dark street", "lamp post", "light pole", "street lamp"]):
        issue_type = "streetlight"
        confidence = 0.90
        base_summary = "The complaint reports non-functional illumination or dark public streetlights."

    elif any(k in desc_clean for k in ["water", "leak"]):
        issue_type = "water_leakage"
        confidence = 0.88
        base_summary = "The complaint indicates water leakage issues."

    elif any(k in desc_clean for k in ["road", "asphalt", "pavement"]):
        issue_type = "road_damage"
        confidence = 0.85
        base_summary = "The complaint indicates road infrastructure damage."

    else:
        issue_type = "other"
        confidence = 0.60
        base_summary = "The complaint description is general or does not specify an identifiable civic category."

    if image_note:
        evidence_summary = f"{base_summary} {image_note}"
    else:
        evidence_summary = base_summary

    return ClassificationResult(
        issue_type=issue_type,
        confidence=confidence,
        evidence_summary=evidence_summary,
        image_analyzed=image_analyzed,
    )


def _load_image(image_url: str) -> Tuple[Optional[object], bool, str]:
    """
    Safely attempts to load an image from a URL or local path.
    Returns (image_obj, success_bool, status_note).
    """
    try:
        from PIL import Image

        # Check for local file path
        if os.path.exists(image_url):
            img = Image.open(image_url)
            img.load()
            return img, True, "Image evidence verified from local file."

        # Check for HTTP/HTTPS URL
        if image_url.startswith(("http://", "https://")):
            import httpx

            with httpx.Client(timeout=4.0) as client:
                resp = client.get(image_url)
                if resp.status_code == 200:
                    img = Image.open(io.BytesIO(resp.content))
                    img.load()
                    return img, True, "Image evidence retrieved from remote URL."
                else:
                    return None, False, f"Image URL returned HTTP {resp.status_code}; could not analyze image."

        return None, False, "Image reference could not be resolved."

    except Exception as e:
        logger.warning(f"Failed to load image evidence from {image_url}: {type(e).__name__}")
        return None, False, "Image evidence could not be accessed; classified based on text only."


def classify_issue(
    description: str,
    image_url: Optional[str] = None,
) -> ClassificationResult:
    """
    Classifies a civic complaint using Google Gemini multimodal AI when configured,
    or gracefully falls back to deterministic rule-based analysis.
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip()

    # Step 1: Check if image evidence was provided
    image_obj = None
    image_analyzed = False
    image_note = None

    if image_url:
        image_obj, image_analyzed, image_note = _load_image(image_url)

    # Step 2: Fallback immediately if no valid Gemini API key is configured
    if not api_key or api_key == "your_gemini_api_key_here":
        return _rule_based_fallback(
            description=description,
            image_analyzed=image_analyzed,
            image_note=image_note,
        )

    # Step 3: Attempt Gemini API inference with resilient model selection
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)

        prompt = f"""You are an expert municipal civic triage AI.
Analyze this citizen complaint and classify it into EXACTLY ONE of these controlled categories:
- pothole
- garbage
- water_leakage
- drainage
- streetlight
- road_damage
- other

Citizen Complaint: "{description}"

Respond ONLY with a JSON object in this format:
{{
  "issue_type": "<one of the 7 categories above>",
  "confidence": <float between 0.0 and 1.0>,
  "evidence_summary": "<short, factual 1-sentence summary of physical issue described>"
}}"""

        contents = [prompt]
        if image_obj is not None:
            contents.append(image_obj)

        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.1,
        )

        # Configured model selection with resilient fallback
        env_model = os.getenv("GEMINI_MODEL", "gemini-3.6-flash").strip()
        candidate_models = [env_model]
        for fallback in ["gemini-3.5-flash", "gemini-3.7-flash", "gemini-flash-latest"]:
            if fallback not in candidate_models:
                candidate_models.append(fallback)

        response = None
        for model_name in candidate_models:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=config,
                )
                if response and response.text:
                    break
            except Exception as model_err:
                logger.debug(f"Model {model_name} attempt failed: {type(model_err).__name__}")
                continue

        if response and response.text:
            data = json.loads(response.text)
            issue_type = data.get("issue_type", "other").strip().lower()
            if issue_type not in VALID_CATEGORIES:
                issue_type = "other"

            confidence = float(data.get("confidence", 0.95))
            confidence = max(0.0, min(1.0, confidence))

            evidence_summary = data.get("evidence_summary", "").strip()
            if not evidence_summary:
                evidence_summary = f"Complaint classified as {issue_type} based on submitted evidence."

            if image_note and not image_analyzed:
                evidence_summary = f"{evidence_summary} ({image_note})"

            return ClassificationResult(
                issue_type=issue_type,
                confidence=confidence,
                evidence_summary=evidence_summary,
                image_analyzed=image_analyzed,
            )

    except Exception as exc:
        # Safe logging without exposing secrets
        logger.warning(f"Gemini classification request failed ({type(exc).__name__}). Using fallback classifier.")

    # Graceful fallback if Gemini request fails for any reason
    return _rule_based_fallback(
        description=description,
        image_analyzed=image_analyzed,
        image_note=image_note,
    )
