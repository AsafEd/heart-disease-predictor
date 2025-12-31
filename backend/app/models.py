"""SQLAlchemy database models."""
from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime
from .database import Base


class Submission(Base):
    """Model for storing prediction submissions."""
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Input features
    age = Column(Integer, nullable=False)
    sex = Column(Integer, nullable=False)
    cp = Column(Integer, nullable=False)
    trtbps = Column(Integer, nullable=False)
    chol = Column(Integer, nullable=False)
    fbs = Column(Integer, nullable=False)
    restecg = Column(Integer, nullable=False)
    thalachh = Column(Integer, nullable=False)
    exng = Column(Integer, nullable=False)
    ca = Column(Integer, nullable=False)

    # Prediction results
    predicted_label = Column(Integer, nullable=False)
    predicted_probability = Column(Float, nullable=False)

    # Optional metadata
    note = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    ip = Column(String, nullable=True)

    def to_dict(self):
        """Convert model to dictionary."""
        return {
            "id": self.id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "age": self.age,
            "sex": self.sex,
            "cp": self.cp,
            "trtbps": self.trtbps,
            "chol": self.chol,
            "fbs": self.fbs,
            "restecg": self.restecg,
            "thalachh": self.thalachh,
            "exng": self.exng,
            "ca": self.ca,
            "predicted_label": self.predicted_label,
            "predicted_probability": self.predicted_probability,
            "note": self.note,
            "user_agent": self.user_agent,
            "ip": self.ip
        }
