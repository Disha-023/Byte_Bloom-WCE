"""Integration boundary and data provider contract for central complaint systems (Commit 4 Milestone).

Establishes the integration between the autonomous Agent Service
and the central civic complaint management system (Node/Express backend & PostgreSQL complaints table).
"""

import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
import httpx
from sqlalchemy.orm import Session

from .monitoring_service import get_monitoring_record
from ..models.complaint_monitoring import ComplaintMonitoring
from ..config import get_settings

logger = logging.getLogger("agent_service.complaint_data_provider")


# Custom Exception Hierarchy
class CentralApiError(Exception):
    """Base exception for Central Complaint API communication errors."""
    pass


class CentralApiConnectionError(CentralApiError):
    """Raised when the Central Complaint API server is unreachable."""
    pass


class CentralApiTimeoutError(CentralApiError):
    """Raised when requests to the Central Complaint API time out."""
    pass


class CentralApiMalformedDataError(CentralApiError):
    """Raised when the Central Complaint API returns unexpected or malformed payload structure."""
    pass


class ComplaintNotFoundError(CentralApiError):
    """Raised when the requested complaint ID does not exist in the central repository."""
    pass


class ComplaintDataProvider(ABC):
    """
    Abstract contract defining how the Agent Service accesses and mutates complaint data.
    Allows seamless transition between local monitoring model and remote central API.
    """

    @abstractmethod
    def get_complaint(self, complaint_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves raw complaint data."""
        pass

    @abstractmethod
    def update_complaint_status(self, complaint_id: str, new_status: str) -> bool:
        """Updates the operational status of a complaint."""
        pass


class LocalMonitoringComplaintDataProvider(ComplaintDataProvider):
    """
    Local implementation using the PostgreSQL complaint_monitoring table.
    Used for isolated standalone testing.
    """

    def __init__(self, db: Session):
        self.db = db

    def get_complaint(self, complaint_id: str) -> Optional[Dict[str, Any]]:
        record = get_monitoring_record(self.db, complaint_id)
        if not record:
            return None
        return {
            "complaint_id": record.complaint_id,
            "status": record.status,
            "priority": record.priority,
            "department": record.department,
            "sla_hours": record.sla_hours,
            "deadline": record.deadline.isoformat(),
            "created_at": record.created_at.isoformat() if record.created_at else None,
            "sla_status": record.sla_status,
        }

    def update_complaint_status(self, complaint_id: str, new_status: str) -> bool:
        record = get_monitoring_record(self.db, complaint_id)
        if not record:
            return False
        record.status = new_status
        self.db.commit()
        return True


class CentralComplaintApiDataProvider(ComplaintDataProvider):
    """
    Real HTTP integration provider connecting Agent Service to the central Node/Express backend
    and PostgreSQL complaints table.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        timeout: Optional[float] = None,
        client: Optional[httpx.Client] = None,
    ):
        settings = get_settings()
        self.base_url = (base_url or getattr(settings, "CENTRAL_COMPLAINT_API_URL", "http://localhost:5000/api")).rstrip("/")
        self.timeout = timeout if timeout is not None else getattr(settings, "CENTRAL_COMPLAINT_API_TIMEOUT", 5.0)
        self._custom_client = client

    def _get_client(self) -> httpx.Client:
        if self._custom_client is not None:
            return self._custom_client
        return httpx.Client(timeout=self.timeout)

    def get_complaint(self, complaint_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves real complaint record from the Central Complaint API (GET /api/complaints/:complaintId).
        Never converts failure into fake or mocked data.
        """
        if not complaint_id or not complaint_id.strip():
            return None

        url = f"{self.base_url}/complaints/{complaint_id.strip()}"
        client = self._get_client()

        try:
            response = client.get(url)
            if response.status_code == 404:
                logger.info("Complaint '%s' not found in central repository (404)", complaint_id)
                return None

            if response.status_code != 200:
                raise CentralApiError(
                    f"Central API error: received HTTP {response.status_code} for complaint '{complaint_id}'"
                )

            try:
                data = response.json()
            except Exception as e:
                raise CentralApiMalformedDataError(
                    f"Invalid JSON received from central API for complaint '{complaint_id}': {e}"
                )

            if not isinstance(data, dict):
                raise CentralApiMalformedDataError(
                    f"Malformed response: expected JSON object, got {type(data).__name__}"
                )

            # Central Node/Express API returns { "success": true, "complaint": { ... } }
            raw = data.get("complaint")
            if raw is None and "complaint_id" in data:
                raw = data

            if not isinstance(raw, dict) or "complaint_id" not in raw:
                raise CentralApiMalformedDataError(
                    f"Malformed complaint record for '{complaint_id}': missing 'complaint_id' field"
                )

            return {
                "complaint_id": raw.get("complaint_id"),
                "title": raw.get("title"),
                "description": raw.get("description"),
                "status": raw.get("status"),
                "priority": raw.get("priority") or raw.get("citizen_severity"),
                "department": raw.get("department") or "Unassigned",
                "sla_hours": raw.get("sla_hours"),
                "created_at": raw.get("created_at"),
                "updated_at": raw.get("updated_at"),
                "address": raw.get("address"),
                "additional_location": raw.get("additional_location"),
                "latitude": raw.get("latitude"),
                "longitude": raw.get("longitude"),
                "image_url": raw.get("image_url"),
                "issue_type": raw.get("issue_type") or raw.get("category"),
                "ai_severity": raw.get("ai_severity"),
                "ai_confidence": raw.get("ai_confidence"),
                "evidence_summary": raw.get("evidence_summary"),
                "suggested_action": raw.get("suggested_action"),
                "ai_reason": raw.get("ai_reason"),
                "image_analyzed": raw.get("image_analyzed", False),
            }

        except (httpx.ConnectError, httpx.NetworkError) as exc:
            logger.error("Failed to connect to central API at '%s': %s", url, exc)
            raise CentralApiConnectionError(f"Connection failed to central API at {self.base_url}: {exc}") from exc
        except httpx.TimeoutException as exc:
            logger.error("Timeout connecting to central API at '%s': %s", url, exc)
            raise CentralApiTimeoutError(f"Timeout ({self.timeout}s) calling central API at {url}") from exc
        finally:
            if self._custom_client is None:
                client.close()

    def update_complaint_status(self, complaint_id: str, new_status: str) -> bool:
        """
        Updates central complaint status in PostgreSQL via PATCH /api/complaints/:complaintId/status.
        """
        if not complaint_id or not complaint_id.strip() or not new_status:
            return False

        url = f"{self.base_url}/complaints/{complaint_id.strip()}/status"
        client = self._get_client()

        try:
            response = client.patch(
                url,
                json={"status": new_status},
                headers={"Content-Type": "application/json"}
            )

            if response.status_code == 200:
                data = response.json()
                if isinstance(data, dict) and data.get("success"):
                    logger.info("Successfully updated central status for '%s' to '%s'", complaint_id, new_status)
                    return True
                return False

            if response.status_code == 404:
                logger.warning("Cannot update status: complaint '%s' not found (404)", complaint_id)
                return False

            if response.status_code == 400:
                logger.warning("Central API rejected status update for '%s' to '%s' (400): %s", complaint_id, new_status, response.text)
                return False

            raise CentralApiError(f"Central API returned HTTP {response.status_code}: {response.text}")

        except (httpx.ConnectError, httpx.NetworkError) as exc:
            logger.error("Connection error updating status for '%s': %s", complaint_id, exc)
            raise CentralApiConnectionError(f"Connection failed to central API: {exc}") from exc
        except httpx.TimeoutException as exc:
            logger.error("Timeout updating status for '%s': %s", complaint_id, exc)
            raise CentralApiTimeoutError(f"Timeout ({self.timeout}s) updating status: {exc}") from exc
        finally:
            if self._custom_client is None:
                client.close()


# Backwards compatibility alias
RemoteAuthorityComplaintDataProvider = CentralComplaintApiDataProvider
