import { useState } from 'react'
import { signIn, signUp, confirmSignUp } from './auth'

// Modes: 'signin' | 'signup' | 'confirm'
export default function Auth({ onSignedIn }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [busy, setBusy] = useState(false)

  const run = async (fn) => {
    setError(null)
    setInfo(null)
    setBusy(true)
    try {
      await fn()
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  const handleSignIn = () =>
    run(async () => {
      await signIn(email.trim(), password)
      onSignedIn()
    })

  const handleSignUp = () =>
    run(async () => {
      await signUp(email.trim(), password)
      setInfo(`We sent a 6-digit code to ${email.trim()}. Enter it below.`)
      setMode('confirm')
    })

  const handleConfirm = () =>
    run(async () => {
      await confirmSignUp(email.trim(), code.trim())
      await signIn(email.trim(), password)
      onSignedIn()
    })

  return (
    <div className="auth-card">
      <h2 className="panel-title">
        {mode === 'signin' && 'Sign in'}
        {mode === 'signup' && 'Create account'}
        {mode === 'confirm' && 'Confirm your email'}
      </h2>

      {mode !== 'confirm' && (
        <>
          <label className="field">
            <span className="field-label">Email</span>
            <input
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label className="field">
            <span className="field-label">
              Password {mode === 'signup' && '(8+ chars, a letter and a number)'}
            </span>
            <input
              className="input"
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>
        </>
      )}

      {mode === 'confirm' && (
        <label className="field">
          <span className="field-label">Verification code</span>
          <input
            className="input"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
          />
        </label>
      )}

      {info && <div className="info">{info}</div>}
      {error && <div className="error">{error}</div>}

      {mode === 'signin' && (
        <>
          <button className="submit" onClick={handleSignIn} disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
          <button className="link-btn" onClick={() => { setMode('signup'); setError(null) }}>
            No account? Create one
          </button>
        </>
      )}
      {mode === 'signup' && (
        <>
          <button className="submit" onClick={handleSignUp} disabled={busy}>
            {busy ? 'Creating…' : 'Create account'}
          </button>
          <button className="link-btn" onClick={() => { setMode('signin'); setError(null) }}>
            Already have an account? Sign in
          </button>
        </>
      )}
      {mode === 'confirm' && (
        <button className="submit" onClick={handleConfirm} disabled={busy}>
          {busy ? 'Confirming…' : 'Confirm & sign in'}
        </button>
      )}
    </div>
  )
}
