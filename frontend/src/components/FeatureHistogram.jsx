import { useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

// Feature labels for display
const FEATURE_LABELS = {
  age: 'Age (years)',
  trtbps: 'Blood Pressure (mm Hg)',
  chol: 'Cholesterol (mg/dl)',
  thalachh: 'Max Heart Rate (bpm)'
}

function FeatureHistogram({ feature, distribution, userValue }) {
  if (!distribution) return null

  const { histogram, bin_edges, mean, std } = distribution

  // Create bin labels (center of each bin)
  const labels = histogram.map((_, i) => {
    const center = (bin_edges[i] + bin_edges[i + 1]) / 2
    return center.toFixed(0)
  })

  // Highlight the bin where user's value falls
  const userBinIndex = bin_edges.findIndex((edge, i) => {
    if (i === bin_edges.length - 1) return false
    return userValue >= edge && userValue < bin_edges[i + 1]
  })

  // Create colors array - highlight user's bin
  const backgroundColors = histogram.map((_, i) =>
    i === userBinIndex ? 'rgba(14, 165, 233, 0.8)' : 'rgba(148, 163, 184, 0.5)'
  )
  const borderColors = histogram.map((_, i) =>
    i === userBinIndex ? 'rgb(14, 165, 233)' : 'rgba(148, 163, 184, 0.8)'
  )

  const data = {
    labels,
    datasets: [
      {
        label: 'Dataset Distribution',
        data: histogram,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: FEATURE_LABELS[feature] || feature,
        font: {
          size: 12,
          weight: '500',
        },
        color: '#374151',
        padding: { bottom: 10 }
      },
      tooltip: {
        callbacks: {
          label: (context) => `Count: ${context.raw}`,
          title: (context) => {
            const i = context[0].dataIndex
            return `${bin_edges[i].toFixed(0)} - ${bin_edges[i + 1].toFixed(0)}`
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxTicksLimit: 6,
          font: { size: 10 },
          color: '#6b7280',
        },
        title: {
          display: false,
        }
      },
      y: {
        grid: {
          color: 'rgba(0,0,0,0.05)',
        },
        ticks: {
          font: { size: 10 },
          color: '#6b7280',
        },
        title: {
          display: false,
        }
      },
    },
  }

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-4">
      <div className="h-40">
        <Bar data={data} options={options} />
      </div>
      <div className="mt-2 flex justify-between text-xs text-gray-500">
        <span>Your value: <span className="font-medium text-medical-600">{userValue}</span></span>
        <span>Mean: {mean?.toFixed(1)} | SD: {std?.toFixed(1)}</span>
      </div>
    </div>
  )
}

function FeatureHistograms({ distributions, userValues }) {
  const features = ['age', 'trtbps', 'chol', 'thalachh']

  if (!distributions || Object.keys(distributions).length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        Loading distributions...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
        Your Values vs Dataset Distribution
      </h3>
      <p className="text-sm text-gray-600">
        The highlighted bar shows where your entered value falls within the dataset distribution.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map(feature => (
          <FeatureHistogram
            key={feature}
            feature={feature}
            distribution={distributions[feature]}
            userValue={userValues[feature]}
          />
        ))}
      </div>
    </div>
  )
}

export { FeatureHistogram, FeatureHistograms }
export default FeatureHistograms
