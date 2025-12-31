"""Pydantic schemas for request/response validation."""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator


class PredictionRequest(BaseModel):
    """Request schema for prediction endpoint."""
    age: int = Field(..., ge=1, le=120, description="Patient age in years (1-120)")
    sex: int = Field(..., ge=0, le=1, description="Biological sex (0=Female, 1=Male)")
    cp: int = Field(..., ge=0, le=3, description="Chest pain type (0-3)")
    trtbps: int = Field(..., ge=50, le=250, description="Resting blood pressure in mm Hg (50-250)")
    chol: int = Field(..., ge=80, le=700, description="Serum cholesterol in mg/dl (80-700)")
    fbs: int = Field(..., ge=0, le=1, description="Fasting blood sugar > 120 mg/dl (0=No, 1=Yes)")
    restecg: int = Field(..., ge=0, le=2, description="Resting ECG results (0-2)")
    thalachh: int = Field(..., ge=50, le=250, description="Maximum heart rate achieved (50-250)")
    exng: int = Field(..., ge=0, le=1, description="Exercise-induced angina (0=No, 1=Yes)")
    ca: int = Field(..., ge=0, le=3, description="Number of major vessels (0-3)")
    note: Optional[str] = Field(None, max_length=500, description="Optional user note")

    class Config:
        json_schema_extra = {
            "example": {
                "age": 55,
                "sex": 1,
                "cp": 2,
                "trtbps": 130,
                "chol": 250,
                "fbs": 0,
                "restecg": 1,
                "thalachh": 150,
                "exng": 0,
                "ca": 1,
                "note": "Routine checkup"
            }
        }


class PredictionResponse(BaseModel):
    """Response schema for prediction endpoint."""
    predicted_label: int = Field(..., description="Predicted class (0=No disease, 1=Disease)")
    predicted_probability: float = Field(..., description="Probability of heart disease (0-1)")
    input_echo: Dict[str, int] = Field(..., description="Echo of validated input values")
    submission_id: int = Field(..., description="ID of the saved submission")


class MetricsResponse(BaseModel):
    """Response schema for model metrics endpoint."""
    accuracy: float
    precision: float
    recall: float
    f1: float
    confusion_matrix: List[List[int]]
    test_size: int
    train_size: int


class FeatureOption(BaseModel):
    """Option for categorical/binary features."""
    value: int
    label: str


class FeatureInfo(BaseModel):
    """Information about a single feature."""
    label: str
    description: str
    type: str
    min: Optional[int] = None
    max: Optional[int] = None
    unit: Optional[str] = None
    options: Optional[List[FeatureOption]] = None


class DistributionData(BaseModel):
    """Histogram distribution data for a numeric feature."""
    histogram: List[int]
    bin_edges: List[float]
    min: float
    max: float
    mean: float
    std: float


class SubmissionResponse(BaseModel):
    """Response schema for a single submission."""
    id: int
    created_at: datetime
    age: int
    sex: int
    cp: int
    trtbps: int
    chol: int
    fbs: int
    restecg: int
    thalachh: int
    exng: int
    ca: int
    predicted_label: int
    predicted_probability: float
    note: Optional[str]
    user_agent: Optional[str]
    ip: Optional[str]

    class Config:
        from_attributes = True


class SubmissionListResponse(BaseModel):
    """Response schema for submissions list endpoint."""
    submissions: List[SubmissionResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class SubmissionStats(BaseModel):
    """Statistics about submissions."""
    total_count: int
    average_risk: float
    risk_distribution: Dict[str, int]  # low, medium, high counts


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    model_trained: bool
    database_connected: bool
