import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, Link } from 'react-router-dom'
import { Reveal } from '../components/Reveal'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        setMessage('Check your email for the confirmation link!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        navigate('/dashboard')
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="authPage">
      {/* Background Ambience */}
      <div className="aurora" aria-hidden="true" style={{ position: 'fixed', zIndex: -1 }}>
        <div className="auroraLayer a1" />
        <div className="auroraLayer a2" />
        <div className="auroraLayer a3" />
      </div>

      <Reveal className="authCard" delay={100}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
             <img 
               src="https://vdbmhqlogqrxozaibntq.supabase.co/storage/v1/object/public/public-files/divee.ai-logo.png" 
               alt="Divee.AI logo" 
               style={{ width: '40px', height: '40px' }}
             />
             <span style={{ 
               fontFamily: 'var(--font-display)', 
               fontWeight: 700, 
               fontSize: '24px', 
               color: 'var(--heading)' 
             }}>Divee.AI</span>
          </Link>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--heading)' }}>
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h1>
          <p style={{ marginTop: '8px', color: 'rgba(2, 48, 71, 0.6)' }}>
            {isSignUp ? 'Start engaging your readers today.' : 'Sign in to manage your widget.'}
          </p>
        </div>

        <form onSubmit={handleAuth} style={{ display: 'grid', gap: '20px' }}>
          <div>
            <label className="inputLabel" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="inputField"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label className="inputLabel" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="inputField"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div style={{ 
              padding: '12px', 
              borderRadius: '10px', 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.2)', 
              color: '#dc2626', 
              fontSize: '14px' 
            }}>
              {error}
            </div>
          )}

          {message && (
            <div style={{ 
              padding: '12px', 
              borderRadius: '10px', 
              background: 'rgba(34, 197, 94, 0.1)', 
              border: '1px solid rgba(34, 197, 94, 0.2)', 
              color: '#16a34a', 
              fontSize: '14px' 
            }}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btnPrimary"
            style={{ width: '100%', marginTop: '8px' }}
          >
            {loading ? 'Processing...' : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'rgba(2, 48, 71, 0.6)' }}>
          {isSignUp ? 'Already have an account? ' : "New to Divee? "}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ 
              background: 'none', 
              border: 'none', 
              padding: 0, 
              color: 'var(--primary)', 
              fontWeight: 600, 
              cursor: 'pointer' 
            }}
          >
            {isSignUp ? 'Sign in' : 'Create account'}
          </button>
        </div>
      </Reveal>
    </main>
  )
}
