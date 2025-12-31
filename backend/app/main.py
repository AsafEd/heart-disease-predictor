"""FastAPI application for Heart Disease Risk Prediction."""
import csv
import io
import os
from datetime import datetime
from typing import Optional
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Depends, Query, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from .database import get_db, init_db
from .models import Submission
from .ml_model import get_model, init_model
from .schemas import (
    PredictionRequest, PredictionResponse, MetricsResponse,
    SubmissionResponse, SubmissionListResponse, SubmissionStats,
    HealthResponse
)

# Check if we're in production (frontend built)
# Try multiple possible locations for the frontend dist
_possible_frontend_dirs = [
    Path(__file__).parent.parent.parent / "frontend" / "dist",
    Path("/app/frontend/dist"),  # Docker path
    Path("frontend/dist"),  # Relative path
]
FRONTEND_DIR = None
for _dir in _possible_frontend_dirs:
    if _dir.exists():
        FRONTEND_DIR = _dir
        break
IS_PRODUCTION = FRONTEND_DIR is not None and FRONTEND_DIR.exists()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler - runs on startup and shutdown."""
    # Startup
    print("Initializing database...")
    init_db()
    print("Loading and training ML model...")
    init_model()
    print("Application ready!")
    yield
    # Shutdown
    print("Shutting down...")


app = FastAPI(
    title="Heart Disease Risk Prediction API",
    description="Educational API for predicting heart disease risk using machine learning",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for flexibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", response_model=HealthResponse)
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint."""
    model = get_model()
    # Test database connection
    try:
        db.execute(func.now())
        db_connected = True
    except Exception:
        db_connected = False

    return HealthResponse(
        status="healthy" if model.is_trained and db_connected else "degraded",
        model_trained=model.is_trained,
        database_connected=db_connected
    )


@app.post("/api/predict", response_model=PredictionResponse)
async def predict(
    request: PredictionRequest,
    req: Request,
    db: Session = Depends(get_db)
):
    """
    Predict heart disease risk for a patient.

    Saves the submission to the database and returns the prediction.
    """
    model = get_model()

    # Extract features for prediction
    features = {
        'age': request.age,
        'sex': request.sex,
        'cp': request.cp,
        'trtbps': request.trtbps,
        'chol': request.chol,
        'fbs': request.fbs,
        'restecg': request.restecg,
        'thalachh': request.thalachh,
        'exng': request.exng,
        'ca': request.ca
    }

    # Get prediction
    result = model.predict(features)

    # Save submission to database
    submission = Submission(
        age=request.age,
        sex=request.sex,
        cp=request.cp,
        trtbps=request.trtbps,
        chol=request.chol,
        fbs=request.fbs,
        restecg=request.restecg,
        thalachh=request.thalachh,
        exng=request.exng,
        ca=request.ca,
        predicted_label=result['predicted_label'],
        predicted_probability=result['predicted_probability'],
        note=request.note,
        user_agent=req.headers.get('user-agent'),
        ip=req.client.host if req.client else None
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    return PredictionResponse(
        predicted_label=result['predicted_label'],
        predicted_probability=result['predicted_probability'],
        input_echo=result['input_echo'],
        submission_id=submission.id
    )


@app.get("/api/metrics", response_model=MetricsResponse)
async def get_metrics():
    """Get model evaluation metrics computed on the test set."""
    model = get_model()
    metrics = model.get_metrics()
    return MetricsResponse(**metrics)


@app.get("/api/distributions")
async def get_distributions():
    """Get dataset distributions for numeric features (for histogram visualization)."""
    model = get_model()
    return model.get_distributions()


@app.get("/api/features")
async def get_feature_info():
    """Get information about all features for the form UI."""
    model = get_model()
    return model.get_feature_info()


@app.get("/api/submissions", response_model=SubmissionListResponse)
async def list_submissions(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    date_from: Optional[str] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Filter to date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """List prediction submissions with pagination and date filtering."""
    query = db.query(Submission)

    # Apply date filters
    if date_from:
        try:
            from_date = datetime.strptime(date_from, "%Y-%m-%d")
            query = query.filter(Submission.created_at >= from_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date_from format. Use YYYY-MM-DD")

    if date_to:
        try:
            to_date = datetime.strptime(date_to, "%Y-%m-%d")
            # Include the entire day
            to_date = to_date.replace(hour=23, minute=59, second=59)
            query = query.filter(Submission.created_at <= to_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date_to format. Use YYYY-MM-DD")

    # Get total count
    total = query.count()

    # Apply pagination
    offset = (page - 1) * per_page
    submissions = query.order_by(Submission.created_at.desc()).offset(offset).limit(per_page).all()

    total_pages = (total + per_page - 1) // per_page if total > 0 else 1

    return SubmissionListResponse(
        submissions=[SubmissionResponse.model_validate(s) for s in submissions],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages
    )


@app.get("/api/submissions/stats", response_model=SubmissionStats)
async def get_submission_stats(
    date_from: Optional[str] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Filter to date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """Get statistics about submissions."""
    query = db.query(Submission)

    # Apply date filters
    if date_from:
        try:
            from_date = datetime.strptime(date_from, "%Y-%m-%d")
            query = query.filter(Submission.created_at >= from_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date_from format")

    if date_to:
        try:
            to_date = datetime.strptime(date_to, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
            query = query.filter(Submission.created_at <= to_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date_to format")

    submissions = query.all()
    total_count = len(submissions)

    if total_count == 0:
        return SubmissionStats(
            total_count=0,
            average_risk=0.0,
            risk_distribution={"low": 0, "medium": 0, "high": 0}
        )

    # Calculate average risk
    avg_risk = sum(s.predicted_probability for s in submissions) / total_count

    # Categorize risk levels
    low = sum(1 for s in submissions if s.predicted_probability < 0.3)
    medium = sum(1 for s in submissions if 0.3 <= s.predicted_probability < 0.6)
    high = sum(1 for s in submissions if s.predicted_probability >= 0.6)

    return SubmissionStats(
        total_count=total_count,
        average_risk=round(avg_risk, 4),
        risk_distribution={"low": low, "medium": medium, "high": high}
    )


@app.get("/api/submissions/export")
async def export_submissions(
    date_from: Optional[str] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Filter to date (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """Export submissions as CSV file."""
    query = db.query(Submission)

    # Apply date filters
    if date_from:
        try:
            from_date = datetime.strptime(date_from, "%Y-%m-%d")
            query = query.filter(Submission.created_at >= from_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date_from format")

    if date_to:
        try:
            to_date = datetime.strptime(date_to, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
            query = query.filter(Submission.created_at <= to_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date_to format")

    submissions = query.order_by(Submission.created_at.desc()).all()

    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)

    # Header row
    writer.writerow([
        'id', 'created_at', 'age', 'sex', 'cp', 'trtbps', 'chol', 'fbs',
        'restecg', 'thalachh', 'exng', 'ca', 'predicted_label',
        'predicted_probability', 'note'
    ])

    # Data rows
    for s in submissions:
        writer.writerow([
            s.id, s.created_at.isoformat() if s.created_at else '',
            s.age, s.sex, s.cp, s.trtbps, s.chol, s.fbs,
            s.restecg, s.thalachh, s.exng, s.ca,
            s.predicted_label, s.predicted_probability, s.note or ''
        ])

    output.seek(0)

    # Generate filename with timestamp
    filename = f"submissions_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# Serve frontend static files in production
if IS_PRODUCTION:
    # Serve static assets
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIR / "assets")), name="assets")

    # Catch-all route for SPA - must be last
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """Serve the React SPA for all non-API routes."""
        # Check if file exists in dist
        file_path = FRONTEND_DIR / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        # Return index.html for SPA routing
        return FileResponse(FRONTEND_DIR / "index.html")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
