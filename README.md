# Heart Disease Risk Prediction Web App

A production-quality educational medical web application for predicting heart disease risk using a trained Logistic Regression model.

## Features

- **Risk Prediction**: Enter patient clinical data and get instant heart disease risk predictions
- **Visual Risk Display**: Color-coded gauge showing risk probability (green/yellow/red thresholds)
- **Feature Distributions**: Interactive histograms comparing patient values to the dataset
- **Model Metrics**: View accuracy, precision, recall, and F1 score computed on a held-out test set
- **Submission History**: Dashboard to review all predictions with filtering and CSV export
- **Educational Content**: Explanations of medical metrics and features

## Tech Stack

- **Backend**: Python FastAPI with SQLAlchemy (SQLite)
- **ML**: scikit-learn Logistic Regression with preprocessing pipeline
- **Frontend**: React (Vite) with Tailwind CSS
- **Charts**: Chart.js via react-chartjs-2

## Prerequisites

- Python 3.9+
- Node.js 18+
- npm or yarn

## Quick Start

### 1. Clone and Navigate

```bash
cd "Project Heart Attack"
```

### 2. Set Up Backend

```bash
# Create and activate virtual environment
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Run Backend

```bash
# From the backend directory with venv activated
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

### 4. Set Up Frontend (new terminal)

```bash
cd frontend
npm install
```

### 5. Run Frontend

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/predict` | POST | Make a prediction (saves to DB) |
| `/api/metrics` | GET | Get model evaluation metrics |
| `/api/distributions` | GET | Get dataset distributions for histograms |
| `/api/features` | GET | Get feature info for the form UI |
| `/api/submissions` | GET | List submissions with pagination |
| `/api/submissions/stats` | GET | Get submission statistics |
| `/api/submissions/export` | GET | Export submissions as CSV |

### Prediction Request Example

```json
POST /api/predict
{
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
```

### Prediction Response

```json
{
  "predicted_label": 1,
  "predicted_probability": 0.6543,
  "input_echo": { ... },
  "submission_id": 1
}
```

## Dataset Features

| Feature | Description | Range/Values |
|---------|-------------|--------------|
| age | Patient age | 1-120 years |
| sex | Biological sex | 0=Female, 1=Male |
| cp | Chest pain type | 0-3 (categorical) |
| trtbps | Resting blood pressure | 50-250 mm Hg |
| chol | Serum cholesterol | 80-700 mg/dl |
| fbs | Fasting blood sugar > 120 | 0=No, 1=Yes |
| restecg | Resting ECG results | 0-2 (categorical) |
| thalachh | Max heart rate achieved | 50-250 bpm |
| exng | Exercise-induced angina | 0=No, 1=Yes |
| ca | Major vessels colored | 0-3 (categorical) |

## Model Pipeline

1. **Preprocessing**:
   - StandardScaler on numeric features (age, trtbps, chol, thalachh)
   - OneHotEncoder on categorical features (cp, restecg, ca)
   - Passthrough on binary features (sex, fbs, exng)

2. **Model**: LogisticRegression (max_iter=1000, random_state=0)

3. **Training**: 80/20 train/test split with stratification

## Testing

Run the test script to verify the API is working:

```bash
# From the project root (with backend running)
python test_api.py
```

## Project Structure

```
Project Heart Attack/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI routes
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── database.py      # DB configuration
│   │   └── ml_model.py      # ML pipeline
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── tailwind.config.js
├── data/
│   └── heart.csv            # Dataset
├── README.md
└── test_api.py
```

## Disclaimer

This tool is for **educational purposes only**. It is not intended to provide medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical concerns.

## License

MIT License
