"""Integration boundary and data provider contract for external complaint systems (Commit 3).

Establishes the integration abstraction between the autonomous Agent Service
and the broader civic complaint management system (Member 3 authority dashboard / backend).
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session

from .monitoring_service import get_monitoring_record
from ..models.complaint_monitoring import ComplaintMonitoring


class ComplaintDataProvider(ABC):
    """
    Abstract contract defining how the Agent Service accesses and mutates complaint data.
    Allows seamless transition from the standalone local monitoring model to a remote
    authority API when deployed in a distributed environment.
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
    Ensures complete standalone functionality for hackathon evaluation.
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
            "sla_status": record.sla_status,
        }

    def update_complaint_status(self, complaint_id: str, new_status: str) -> bool:
        record = get_monitoring_record(self.db, complaint_id)
        if not record:
            return False
        record.status = new_status
        self.db.commit()
        return True


class RemoteAuthorityComplaintDataProvider(ComplaintDataProvider):
    """
    Adapter skeleton for future integration with Member 3's Node/Express or PostgreSQL backend.
    Ready to connect once remote endpoints (e.g., http://localhost:5000/api/complaints) are standardized.
    """

    def __init__(self, base_url: str = "http://localhost:5000/api"):
        self.base_url = base_url

    def get_complaint(self, complaint_id: str) -> Optional[Dict[str, Any]]:
        # Future HTTP client integration
        return None

    def update_complaint_status(self, complaint_id: str, new_status: str) -> bool:
        # Future HTTP client integration
        return False
