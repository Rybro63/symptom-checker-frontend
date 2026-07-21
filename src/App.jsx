import { useState, useEffect, useCallback } from 'react'
import { API_URL } from './config'
import Auth from './Auth.jsx'
import { getSession, getIdToken, signOut, currentUserEmail } from './auth'

const TRIAGE = {
  emergency: { label: 'Emergency', tone: 'emergency', note: 'Seek immediate care — call 911.' },
  urgent: { label: 'Urgent', tone: 'urgent', note: 'See a clinician within 24 hours.' },
  routine: { label: 'Routine', tone: 'routine', note: 'Schedule a normal appointment.' },
  self_care: { label: 'Self-care', tone: 'self_care', note: 'Manageable at home — monitor symptoms.' },
}

function ConfidenceBar({ value }) {
  const pct = Math.round(value * 100)
  return (
    <div className="conf">
      <div className="conf-track">
        <div className="conf-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="conf-pct">{pct}%</span>
    </div>
  )
}

function Result({ data }) {
  const { result } = data
  const t = TRIAGE[result.triage_level] || TRIAGE.routine

  return (
    <div className="result">
      <div className={`triage triage--${t.tone}`}>
        <div className="triage-label">{t.label}</div>
        <div className="triage-note">{t.note}</div>
      </div>

      <p className="rationale">{result.triage_rationale}</p>

      {result.low_confidence && (
        <div className="low-conf">
          Confidence was too low to list specific conditions reliably. Please see a
          clinician for an in-person evaluation.
        </div>
      )}

      {result.possible_conditions.length > 0 && (
        <div className="block">
          <h3 className="block-title">Possible conditions</h3>
          <ul className="conditions">
            {result.possible_conditions.map((c, i) => (
              <li key={i} className="condition">
                <div className="condition-head">
                  <span className="condition-name">{c.name}</span>
                  {c.common && <span className="badge">common</span>}
                </div>
                <ConfidenceBar value={c.confidence} />
                <p className="condition-reason">{c.reasoning}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.red_flags.length > 0 && (
        <div className="block">
          <h3 className="block-title">Seek care if you notice</h3>
          <ul className="flags">
            {result.red_flags.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      {result.self_care_advice && (
        <div className="block">
          <h3 className="block-title">Self-care guidance</h3>
          <p className="advice">{result.self_care_advice}</p>
        </div>
      )}

      <p className="disclaimer">{data.disclaimer}</p>
    </div>
  )
}

async function authedFetch(path, options = {}) {
  const token = await getIdToken()
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` },
  })
}

export default function App() {
  const [authed, setAuthed] = useState(null) // null = checking, false = signed out, true = in

  const [form, setForm] = useState({
    symptoms: '',
    age: '',
    sex: 'male',
    duration_hours: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [historyOpen, setHistoryOpen] = useState(false)

  useEffect(() => {
    getSession().then((s) => setAuthed(!!s))
  }, [])

  const loadHistory = useCallback(async () => {
    try {
      const res = await authedFetch(`/v1/checks?limit=10`)
      if (!res.ok) return
      const data = await res.json()
      setHistory(data.items || [])
    } catch {
      /* history is non-critical; ignore */
    }
  }, [])

  useEffect(() => {
    if (authed) loadHistory()
  }, [authed, loadHistory])

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const submit = async () => {
    setError(null)
    if (form.symptoms.trim().length < 10) {
      setError('Please describe your symptoms in a little more detail (at least 10 characters).')
      return
    }
    if (!form.age || Number(form.age) < 0 || Number(form.age) > 120) {
      setError('Please enter a valid age between 0 and 120.')
      return
    }

    const payload = {
      symptoms: form.symptoms.trim(),
      age: Number(form.age),
      sex: form.sex,
    }
    if (form.duration_hours !== '') payload.duration_hours = Number(form.duration_hours)

    setLoading(true)
    setResult(null)
    try {
      const res = await authedFetch(`/v1/checks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        throw new Error(
          res.status === 502
            ? 'The analysis engine had trouble responding. Please try again.'
            : `Request failed (${res.status}).`
        )
      }
      const data = await res.json()
      setResult(data)
      loadHistory()
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="bg-grid" />
      <div className="bg-glow" />

      <header className="head">
        {authed && (
          <div className="session-bar">
            <span className="session-email">{currentUserEmail()}</span>
            <button
              className="link-btn"
              onClick={() => { signOut(); setAuthed(false); setResult(null); setHistory([]) }}
            >
              Sign out
            </button>
          </div>
        )}
        <div className="eyebrow">AI · clinical triage · educational</div>
        <h1 className="title">Symptom <em>Checker</em></h1>
        <p className="subtitle">
          Describe what you're feeling. An AI model returns a triage level, possible
          conditions with confidence, and warning signs to watch for. This is not a
          medical diagnosis.
        </p>
      </header>

      {authed === null && <div className="empty"><div className="spinner" /></div>}

      {authed === false && (
        <main className="grid grid--single">
          <Auth onSignedIn={() => setAuthed(true)} />
        </main>
      )}

      {authed && (
      <main className="grid">
        <section className="panel">
          <h2 className="panel-title">Your symptoms</h2>

          <label className="field">
            <span className="field-label">What are you experiencing?</span>
            <textarea
              className="input textarea"
              rows={4}
              placeholder="e.g. Sharp pain in my lower right abdomen for about 6 hours, with mild fever and nausea"
              value={form.symptoms}
              onChange={update('symptoms')}
            />
          </label>

          <div className="row">
            <label className="field">
              <span className="field-label">Age</span>
              <input
                className="input"
                type="number"
                min="0"
                max="120"
                placeholder="21"
                value={form.age}
                onChange={update('age')}
              />
            </label>

            <label className="field">
              <span className="field-label">Sex</span>
              <select className="input" value={form.sex} onChange={update('sex')}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label className="field">
              <span className="field-label">Duration (hrs)</span>
              <input
                className="input"
                type="number"
                min="0"
                placeholder="6"
                value={form.duration_hours}
                onChange={update('duration_hours')}
              />
            </label>
          </div>

          {error && <div className="error">{error}</div>}

          <button className="submit" onClick={submit} disabled={loading}>
            {loading ? 'Analyzing…' : 'Check symptoms'}
          </button>

          <button
            className="history-toggle"
            onClick={() => setHistoryOpen((o) => !o)}
          >
            {historyOpen ? 'Hide' : 'Show'} recent checks ({history.length})
          </button>

          {historyOpen && (
            <ul className="history">
              {history.length === 0 && <li className="history-empty">No checks yet.</li>}
              {history.map((h) => (
                <li key={h.check_id} className="history-item">
                  <span className={`dot dot--${h.result.triage_level}`} />
                  <span className="history-text">
                    {h.request.symptoms.slice(0, 48)}
                    {h.request.symptoms.length > 48 ? '…' : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel result-panel">
          {!result && !loading && (
            <div className="empty">
              <div className="empty-mark">+</div>
              <p>Your assessment will appear here.</p>
            </div>
          )}
          {loading && (
            <div className="empty">
              <div className="spinner" />
              <p>Consulting the model…</p>
            </div>
          )}
          {result && <Result data={result} />}
        </section>
      </main>
      )}

      <footer className="foot">
        Built by Ryvath Mattey · FastAPI · Claude · AWS Lambda · DynamoDB ·{' '}
        <a href="https://rybro63.github.io/portfolio_website/">portfolio</a>
      </footer>
    </div>
  )
}
