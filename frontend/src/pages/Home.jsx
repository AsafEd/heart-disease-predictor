import { useState, useEffect } from 'react'
import PredictionForm from '../components/PredictionForm'
import RiskGauge from '../components/RiskGauge'
import FeatureHistograms from '../components/FeatureHistogram'
import MetricsDisplay from '../components/MetricsDisplay'

function Disclaimer() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h4 className="text-sm font-medium text-amber-800">Educational Tool Only</h4>
          <p className="text-sm text-amber-700 mt-1">
            This tool is for educational and demonstration purposes only. It is not intended to provide medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for any medical concerns.
          </p>
        </div>
      </div>
    </div>
  )
}

function Home() {
  const [metrics, setMetrics] = useState(null)
  const [distributions, setDistributions] = useState(null)
  const [prediction, setPrediction] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [submittedValues, setSubmittedValues] = useState(null)

  // Load metrics and distributions on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [metricsRes, distRes] = await Promise.all([
          fetch('/api/metrics'),
          fetch('/api/distributions')
        ])

        if (metricsRes.ok) {
          setMetrics(await metricsRes.json())
        }
        if (distRes.ok) {
          setDistributions(await distRes.json())
        }
      } catch (err) {
        console.error('Failed to load initial data:', err)
      }
    }
    loadData()
  }, [])

  const handleSubmit = async (data) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Prediction failed')
      }

      const result = await response.json()
      setPrediction(result)
      setSubmittedValues(data)

      // Scroll to results
      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Disclaimer */}
      <Disclaimer />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Form */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Patient Risk Assessment
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Enter patient clinical data to estimate heart disease risk using our logistic regression model.
          </p>
          <PredictionForm onSubmit={handleSubmit} isLoading={isLoading} />

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* Right Column: Results */}
        <div id="results" className="space-y-6">
          {prediction ? (
            <>
              {/* Risk Gauge */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                  Prediction Result
                </h2>
                <RiskGauge
                  probability={prediction.predicted_probability}
                  label={prediction.predicted_label}
                />
              </div>

              {/* Feature Distributions */}
              {distributions && submittedValues && (
                <div className="card">
                  <FeatureHistograms
                    distributions={distributions}
                    userValues={submittedValues}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Prediction Yet
              </h3>
              <p className="text-sm text-gray-500 max-w-sm">
                Fill in the patient data form and click "Calculate Risk" to see the prediction results and visualizations.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Model Metrics Section */}
      <MetricsDisplay metrics={metrics} />

      {/* About This Model */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          About This Model
        </h3>
        <div className="prose prose-sm text-gray-600 max-w-none">
          <p>
            This application uses a <strong>Logistic Regression</strong> model trained on the heart disease dataset
            to predict the likelihood of heart disease based on various clinical and demographic features.
          </p>
          <h4 className="text-gray-800 font-medium mt-4">Preprocessing Pipeline</h4>
          <ul>
            <li><strong>Numeric features</strong> (age, blood pressure, cholesterol, max heart rate): Standardized using StandardScaler</li>
            <li><strong>Categorical features</strong> (chest pain type, resting ECG, major vessels): One-hot encoded</li>
            <li><strong>Binary features</strong> (sex, fasting blood sugar, exercise angina): Passed through as-is</li>
          </ul>
          <h4 className="text-gray-800 font-medium mt-4">Dataset</h4>
          <p>
            The model was trained on a dataset of approximately 300 patients with various clinical measurements.
            The data was split 80/20 for training and testing, with stratification to maintain class balance.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Home
