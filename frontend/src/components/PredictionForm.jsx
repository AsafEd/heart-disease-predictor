import { useState } from 'react'

// Feature configuration with validation and explanations
const FEATURE_CONFIG = {
  age: {
    label: 'Age',
    description: 'Patient age in years',
    type: 'number',
    min: 1,
    max: 120,
    unit: 'years'
  },
  sex: {
    label: 'Sex',
    description: 'Biological sex of the patient',
    type: 'select',
    options: [
      { value: 0, label: 'Female' },
      { value: 1, label: 'Male' }
    ]
  },
  cp: {
    label: 'Chest Pain Type',
    description: 'Type of chest pain experienced. Typical angina is classic heart-related pain. Atypical angina has some but not all features. Non-anginal pain is unlikely cardiac. Asymptomatic means no chest pain.',
    type: 'select',
    options: [
      { value: 0, label: 'Typical Angina' },
      { value: 1, label: 'Atypical Angina' },
      { value: 2, label: 'Non-Anginal Pain' },
      { value: 3, label: 'Asymptomatic' }
    ]
  },
  trtbps: {
    label: 'Resting Blood Pressure',
    description: 'Blood pressure measured when the patient is at rest upon hospital admission',
    type: 'number',
    min: 50,
    max: 250,
    unit: 'mm Hg'
  },
  chol: {
    label: 'Cholesterol',
    description: 'Serum cholesterol level. Normal is typically below 200 mg/dl. Borderline high is 200-239. High is 240 and above.',
    type: 'number',
    min: 80,
    max: 700,
    unit: 'mg/dl'
  },
  fbs: {
    label: 'Fasting Blood Sugar',
    description: 'Whether fasting blood sugar exceeds 120 mg/dl. Elevated fasting blood sugar can indicate diabetes.',
    type: 'select',
    options: [
      { value: 0, label: 'No (<=120 mg/dl)' },
      { value: 1, label: 'Yes (>120 mg/dl)' }
    ]
  },
  restecg: {
    label: 'Resting ECG',
    description: 'Results of the resting electrocardiogram. Normal is typical. ST-T abnormality indicates possible issues. Left ventricular hypertrophy suggests enlarged heart muscle.',
    type: 'select',
    options: [
      { value: 0, label: 'Normal' },
      { value: 1, label: 'ST-T Wave Abnormality' },
      { value: 2, label: 'Left Ventricular Hypertrophy' }
    ]
  },
  thalachh: {
    label: 'Maximum Heart Rate',
    description: 'Maximum heart rate achieved during exercise stress testing. Higher values generally indicate better cardiovascular fitness.',
    type: 'number',
    min: 50,
    max: 250,
    unit: 'bpm'
  },
  exng: {
    label: 'Exercise-Induced Angina',
    description: 'Whether exercise causes chest pain (angina). This is a significant indicator of coronary artery disease.',
    type: 'select',
    options: [
      { value: 0, label: 'No' },
      { value: 1, label: 'Yes' }
    ]
  },
  ca: {
    label: 'Major Vessels Colored',
    description: 'Number of major blood vessels (0-3) colored by fluoroscopy. More vessels with reduced blood flow indicates higher risk.',
    type: 'select',
    options: [
      { value: 0, label: '0 vessels' },
      { value: 1, label: '1 vessel' },
      { value: 2, label: '2 vessels' },
      { value: 3, label: '3 vessels' }
    ]
  }
}

// Example patient profiles
const EXAMPLES = {
  healthy: {
    label: 'Lower-Risk Example',
    values: {
      age: 45,
      sex: 0,
      cp: 0,
      trtbps: 120,
      chol: 200,
      fbs: 0,
      restecg: 0,
      thalachh: 160,
      exng: 0,
      ca: 0
    }
  },
  higherRisk: {
    label: 'Higher-Risk Example',
    values: {
      age: 62,
      sex: 1,
      cp: 3,
      trtbps: 160,
      chol: 300,
      fbs: 1,
      restecg: 2,
      thalachh: 100,
      exng: 1,
      ca: 2
    }
  }
}

function InfoTooltip({ text }) {
  const [show, setShow] = useState(false)

  return (
    <div className="relative inline-block ml-1">
      <button
        type="button"
        className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-xs hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-medical-500"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        aria-label="More information"
      >
        ?
      </button>
      {show && (
        <div className="absolute z-10 w-64 p-3 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg shadow-lg -left-28 top-6">
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-gray-200 rotate-45"></div>
          {text}
        </div>
      )}
    </div>
  )
}

function PredictionForm({ onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    age: '',
    sex: '',
    cp: '',
    trtbps: '',
    chol: '',
    fbs: '',
    restecg: '',
    thalachh: '',
    exng: '',
    ca: '',
    note: ''
  })
  const [errors, setErrors] = useState({})

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const fillExample = (exampleKey) => {
    const example = EXAMPLES[exampleKey]
    setFormData({ ...example.values, note: '' })
    setErrors({})
  }

  const validate = () => {
    const newErrors = {}

    Object.keys(FEATURE_CONFIG).forEach(field => {
      const config = FEATURE_CONFIG[field]
      const value = formData[field]

      if (value === '' || value === null || value === undefined) {
        newErrors[field] = 'This field is required'
        return
      }

      const numValue = parseInt(value, 10)
      if (isNaN(numValue)) {
        newErrors[field] = 'Please enter a valid number'
        return
      }

      if (config.type === 'number') {
        if (numValue < config.min || numValue > config.max) {
          newErrors[field] = `Must be between ${config.min} and ${config.max}`
        }
      } else if (config.type === 'select') {
        const validValues = config.options.map(o => o.value)
        if (!validValues.includes(numValue)) {
          newErrors[field] = 'Please select a valid option'
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) {
      const data = {}
      Object.keys(FEATURE_CONFIG).forEach(field => {
        data[field] = parseInt(formData[field], 10)
      })
      if (formData.note) {
        data.note = formData.note
      }
      onSubmit(data)
    }
  }

  const renderField = (fieldName) => {
    const config = FEATURE_CONFIG[fieldName]
    const value = formData[fieldName]
    const error = errors[fieldName]

    return (
      <div key={fieldName} className="space-y-1">
        <label htmlFor={fieldName} className="label flex items-center">
          {config.label}
          {config.unit && <span className="text-gray-400 ml-1">({config.unit})</span>}
          <InfoTooltip text={config.description} />
        </label>

        {config.type === 'number' ? (
          <input
            id={fieldName}
            type="number"
            className={`input-field ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
            value={value}
            onChange={(e) => handleChange(fieldName, e.target.value)}
            min={config.min}
            max={config.max}
            placeholder={`${config.min}-${config.max}`}
            aria-describedby={error ? `${fieldName}-error` : undefined}
          />
        ) : (
          <select
            id={fieldName}
            className={`select-field ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
            value={value}
            onChange={(e) => handleChange(fieldName, e.target.value)}
            aria-describedby={error ? `${fieldName}-error` : undefined}
          >
            <option value="">Select...</option>
            {config.options.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {error && (
          <p id={`${fieldName}-error`} className="error-text" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Example Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => fillExample('healthy')}
          className="btn-secondary text-xs"
        >
          Fill Lower-Risk Example
        </button>
        <button
          type="button"
          onClick={() => fillExample('higherRisk')}
          className="btn-secondary text-xs"
        >
          Fill Higher-Risk Example
        </button>
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Demographics */}
        <div className="md:col-span-2">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Demographics
          </h3>
        </div>
        {renderField('age')}
        {renderField('sex')}

        {/* Clinical Measurements */}
        <div className="md:col-span-2 mt-4">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Clinical Measurements
          </h3>
        </div>
        {renderField('trtbps')}
        {renderField('chol')}
        {renderField('thalachh')}
        {renderField('fbs')}

        {/* Cardiac Indicators */}
        <div className="md:col-span-2 mt-4">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Cardiac Indicators
          </h3>
        </div>
        {renderField('cp')}
        {renderField('restecg')}
        {renderField('exng')}
        {renderField('ca')}
      </div>

      {/* Note Field */}
      <div className="space-y-1">
        <label htmlFor="note" className="label">
          Note (Optional)
        </label>
        <textarea
          id="note"
          className="input-field resize-none"
          rows={2}
          value={formData.note}
          onChange={(e) => handleChange('note', e.target.value)}
          placeholder="Add any notes about this prediction..."
          maxLength={500}
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="btn-primary w-full py-3 text-base"
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Calculating...
          </span>
        ) : (
          'Calculate Risk'
        )}
      </button>
    </form>
  )
}

export default PredictionForm
