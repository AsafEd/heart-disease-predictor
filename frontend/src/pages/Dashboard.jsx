import { useState, useEffect, useCallback } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

function StatCard({ label, value, subtext, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
  }

  return (
    <div className={`rounded-lg p-4 ${colorClasses[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm font-medium mt-1">{label}</div>
      {subtext && <div className="text-xs opacity-75 mt-1">{subtext}</div>}
    </div>
  )
}

function RiskDistributionChart({ distribution }) {
  if (!distribution) return null

  const data = {
    labels: ['Low Risk (<30%)', 'Moderate (30-60%)', 'High Risk (>60%)'],
    datasets: [
      {
        data: [distribution.low, distribution.medium, distribution.high],
        backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
        borderWidth: 0,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
        }
      },
    },
  }

  return (
    <div className="h-64">
      <Doughnut data={data} options={options} />
    </div>
  )
}

function SubmissionsTable({ submissions, isLoading }) {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-12 bg-gray-100 rounded"></div>
        ))}
      </div>
    )
  }

  if (!submissions || submissions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No submissions found. Make some predictions to see them here!
      </div>
    )
  }

  const getRiskBadge = (probability) => {
    if (probability < 0.3) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Low</span>
    }
    if (probability < 0.6) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">Moderate</span>
    }
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">High</span>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-2 font-medium text-gray-500">Date</th>
            <th className="text-left py-3 px-2 font-medium text-gray-500">Age</th>
            <th className="text-left py-3 px-2 font-medium text-gray-500">Sex</th>
            <th className="text-left py-3 px-2 font-medium text-gray-500">Probability</th>
            <th className="text-left py-3 px-2 font-medium text-gray-500">Risk</th>
            <th className="text-left py-3 px-2 font-medium text-gray-500">Prediction</th>
            <th className="text-left py-3 px-2 font-medium text-gray-500">Note</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((sub) => (
            <tr key={sub.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-2 text-gray-600">
                {new Date(sub.created_at).toLocaleString()}
              </td>
              <td className="py-3 px-2">{sub.age}</td>
              <td className="py-3 px-2">{sub.sex === 1 ? 'M' : 'F'}</td>
              <td className="py-3 px-2 font-medium">
                {(sub.predicted_probability * 100).toFixed(1)}%
              </td>
              <td className="py-3 px-2">
                {getRiskBadge(sub.predicted_probability)}
              </td>
              <td className="py-3 px-2">
                <span className={sub.predicted_label === 1 ? 'text-red-600' : 'text-green-600'}>
                  {sub.predicted_label === 1 ? 'Disease' : 'No Disease'}
                </span>
              </td>
              <td className="py-3 px-2 text-gray-500 truncate max-w-xs">
                {sub.note || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="btn-secondary text-sm disabled:opacity-50"
      >
        Previous
      </button>
      <span className="text-sm text-gray-500">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="btn-secondary text-sm disabled:opacity-50"
      >
        Next
      </button>
    </div>
  )
}

function Dashboard() {
  const [submissions, setSubmissions] = useState([])
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), per_page: '10' })
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)

      const [subsRes, statsRes] = await Promise.all([
        fetch(`/api/submissions?${params}`),
        fetch(`/api/submissions/stats?${dateFrom ? `date_from=${dateFrom}` : ''}${dateTo ? `&date_to=${dateTo}` : ''}`)
      ])

      if (subsRes.ok) {
        const data = await subsRes.json()
        setSubmissions(data.submissions)
        setTotalPages(data.total_pages)
        setTotal(data.total)
      }

      if (statsRes.ok) {
        setStats(await statsRes.json())
      }
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [page, dateFrom, dateTo])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleFilter = (e) => {
    e.preventDefault()
    setPage(1)
    fetchData()
  }

  const handleExport = async () => {
    const params = new URLSearchParams()
    if (dateFrom) params.append('date_from', dateFrom)
    if (dateTo) params.append('date_to', dateTo)

    const response = await fetch(`/api/submissions/export?${params}`)
    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `submissions_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    }
  }

  const handleClearFilters = () => {
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Review prediction submissions and usage statistics</p>
      </div>

      {/* Filters */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-4">
          <div>
            <label className="label">From Date</label>
            <input
              type="date"
              className="input-field"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="label">To Date</label>
            <input
              type="date"
              className="input-field"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary">
            Apply Filters
          </button>
          <button type="button" onClick={handleClearFilters} className="btn-secondary">
            Clear
          </button>
          <button type="button" onClick={handleExport} className="btn-secondary ml-auto">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </form>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Submissions"
          value={stats?.total_count || 0}
          color="blue"
        />
        <StatCard
          label="Average Risk"
          value={`${((stats?.average_risk || 0) * 100).toFixed(1)}%`}
          color={stats?.average_risk >= 0.6 ? 'red' : stats?.average_risk >= 0.3 ? 'amber' : 'green'}
        />
        <StatCard
          label="Low Risk Cases"
          value={stats?.risk_distribution?.low || 0}
          subtext="< 30% probability"
          color="green"
        />
        <StatCard
          label="High Risk Cases"
          value={stats?.risk_distribution?.high || 0}
          subtext="> 60% probability"
          color="red"
        />
      </div>

      {/* Charts and Table Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Chart */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h2>
          {stats?.total_count > 0 ? (
            <RiskDistributionChart distribution={stats?.risk_distribution} />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No data to display
            </div>
          )}
        </div>

        {/* Recent Submissions Table */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Submissions</h2>
            <span className="text-sm text-gray-500">{total} total</span>
          </div>
          <SubmissionsTable submissions={submissions} isLoading={isLoading} />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
