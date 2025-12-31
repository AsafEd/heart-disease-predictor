import { useMemo } from 'react'

function RiskGauge({ probability, label }) {
  // Calculate the stroke dashoffset for the gauge arc
  // The semicircle has a circumference of about 283 (based on radius 45)
  const circumference = 283
  const percent = probability * 100
  const offset = circumference - (circumference * percent) / 100

  // Determine color based on risk level
  const getColor = (prob) => {
    if (prob < 0.3) return { stroke: '#22c55e', bg: '#dcfce7', text: 'text-green-600', label: 'Low Risk' }
    if (prob < 0.6) return { stroke: '#f59e0b', bg: '#fef3c7', text: 'text-amber-600', label: 'Moderate Risk' }
    return { stroke: '#ef4444', bg: '#fee2e2', text: 'text-red-600', label: 'Higher Risk' }
  }

  const colors = useMemo(() => getColor(probability), [probability])

  // Interpretation text
  const getInterpretation = (prob) => {
    if (prob < 0.3) {
      return 'Based on the provided features, this patient shows indicators typically associated with lower heart disease risk.'
    }
    if (prob < 0.6) {
      return 'Based on the provided features, this patient shows some indicators that may be associated with moderate heart disease risk. Further evaluation may be warranted.'
    }
    return 'Based on the provided features, this patient shows multiple indicators that are often associated with higher heart disease risk. Clinical evaluation is strongly recommended.'
  }

  return (
    <div className="flex flex-col items-center">
      {/* Gauge SVG */}
      <div className="relative w-48 h-28">
        <svg
          className="w-full h-full"
          viewBox="0 0 100 55"
        >
          {/* Background arc */}
          <path
            d="M 5 50 A 45 45 0 0 1 95 50"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Colored arc */}
          <path
            d="M 5 50 A 45 45 0 0 1 95 50"
            fill="none"
            stroke={colors.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="gauge-ring"
            style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.3s' }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className={`text-3xl font-bold ${colors.text}`}>
            {percent.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Risk Label */}
      <div
        className={`mt-2 px-4 py-1.5 rounded-full text-sm font-medium ${colors.text}`}
        style={{ backgroundColor: colors.bg }}
      >
        {colors.label}
      </div>

      {/* Prediction Label */}
      <div className="mt-4 flex items-center gap-2">
        <span className="text-gray-500">Predicted Class:</span>
        <span className={`font-semibold ${label === 1 ? 'text-red-600' : 'text-green-600'}`}>
          {label === 1 ? 'Disease Indicated' : 'No Disease Indicated'}
        </span>
      </div>

      {/* Interpretation */}
      <p className="mt-4 text-sm text-gray-600 text-center max-w-sm">
        {getInterpretation(probability)}
      </p>

      {/* Risk Scale Legend */}
      <div className="mt-6 flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>&lt;30%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span>30-60%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>&gt;60%</span>
        </div>
      </div>
    </div>
  )
}

export default RiskGauge
