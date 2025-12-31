import { useState } from 'react'

function MetricCard({ label, value, description }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <div className="text-2xl font-bold text-medical-600">
        {(value * 100).toFixed(1)}%
      </div>
      <div className="text-sm font-medium text-gray-700 mt-1">{label}</div>
      <div className="text-xs text-gray-500 mt-1">{description}</div>
    </div>
  )
}

function ConfusionMatrix({ matrix }) {
  if (!matrix || matrix.length !== 2) return null

  const [[tn, fp], [fn, tp]] = matrix
  const total = tn + fp + fn + tp

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Confusion Matrix</h4>
      <div className="grid grid-cols-3 gap-1 text-center text-sm max-w-xs">
        {/* Header row */}
        <div></div>
        <div className="text-gray-500 font-medium p-2">Predicted 0</div>
        <div className="text-gray-500 font-medium p-2">Predicted 1</div>

        {/* True 0 row */}
        <div className="text-gray-500 font-medium p-2 text-right">Actual 0</div>
        <div className="bg-green-100 text-green-800 font-medium p-2 rounded">
          TN: {tn}
        </div>
        <div className="bg-red-100 text-red-800 font-medium p-2 rounded">
          FP: {fp}
        </div>

        {/* True 1 row */}
        <div className="text-gray-500 font-medium p-2 text-right">Actual 1</div>
        <div className="bg-red-100 text-red-800 font-medium p-2 rounded">
          FN: {fn}
        </div>
        <div className="bg-green-100 text-green-800 font-medium p-2 rounded">
          TP: {tp}
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Test set size: {total} samples (Train: {Math.round(total * 4)} samples)
      </p>
    </div>
  )
}

function MetricsExplanation({ isOpen, onToggle }) {
  return (
    <div className="border-t border-gray-100 mt-4 pt-4">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 text-sm text-medical-600 hover:text-medical-700 focus:outline-none"
      >
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        What do these metrics mean?
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-800">Accuracy</h4>
            <p>The percentage of all predictions (both disease and no disease) that were correct. While intuitive, it can be misleading with imbalanced datasets.</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-800">Precision</h4>
            <p>Of all patients the model predicted as having heart disease, what percentage actually had it? High precision means fewer false alarms.</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-800">Recall (Sensitivity)</h4>
            <p>Of all patients who actually have heart disease, what percentage did the model correctly identify? <span className="font-medium text-medical-700">In medical screening, high recall is often critical</span> because missing a disease case (false negative) can have serious consequences.</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-800">F1 Score</h4>
            <p>The harmonic mean of precision and recall, providing a single balanced measure. Useful when you want to balance both false positives and false negatives.</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-amber-800">
              <span className="font-medium">Important:</span> In medical contexts, the trade-off between precision and recall depends on the specific use case. For screening (catching all possible cases), high recall is preferred. For diagnostic confirmation, high precision may be more important.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricsDisplay({ metrics }) {
  const [showExplanation, setShowExplanation] = useState(false)

  if (!metrics) {
    return (
      <div className="card animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Model Performance Metrics
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Computed on a held-out test set ({metrics.test_size} samples)
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Accuracy"
          value={metrics.accuracy}
          description="Overall correctness"
        />
        <MetricCard
          label="Precision"
          value={metrics.precision}
          description="Positive predictive value"
        />
        <MetricCard
          label="Recall"
          value={metrics.recall}
          description="Sensitivity"
        />
        <MetricCard
          label="F1 Score"
          value={metrics.f1}
          description="Balanced measure"
        />
      </div>

      <ConfusionMatrix matrix={metrics.confusion_matrix} />

      <MetricsExplanation
        isOpen={showExplanation}
        onToggle={() => setShowExplanation(!showExplanation)}
      />
    </div>
  )
}

export default MetricsDisplay
