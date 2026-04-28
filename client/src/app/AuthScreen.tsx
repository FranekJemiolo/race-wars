import { useState } from 'react'
import { authService, RegisterRequest, LoginRequest, User } from '../network/authService'

interface AuthScreenProps {
  onAuthSuccess: (user: User) => void
  onSpectatorMode: () => void
}

export default function AuthScreen({ onAuthSuccess, onSpectatorMode }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    displayName: '',
    confirmPassword: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        const loginData: LoginRequest = {
          username: formData.username,
          password: formData.password
        }
        
        const result = await authService.login(loginData)
        onAuthSuccess(result.user)
      } else {
        // Registration validation
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match')
        }
        
        if (formData.password.length < 6) {
          throw new Error('Password must be at least 6 characters')
        }
        
        if (formData.username.length < 3) {
          throw new Error('Username must be at least 3 characters')
        }
        
        const registerData: RegisterRequest = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName
        }
        
        const result = await authService.register(registerData)
        onAuthSuccess(result.user)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setError('')
    setFormData({
      username: '',
      email: '',
      password: '',
      displayName: '',
      confirmPassword: ''
    })
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '16px',
        padding: '40px',
        width: '90%',
        maxWidth: '400px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            marginBottom: '8px',
            background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {isLogin ? 'Welcome Back' : 'Join Race Wars'}
          </h1>
          <p style={{ color: '#b8c5d6', fontSize: '0.9rem' }}>
            {isLogin ? 'Sign in to access races' : 'Create an account to start racing'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(231, 76, 60, 0.2)',
            border: '1px solid rgba(231, 76, 60, 0.5)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
            color: '#e74c3c',
            fontSize: '0.9rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              color: '#b8c5d6',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              placeholder="Enter your username"
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea'
                e.target.style.background = 'rgba(255, 255, 255, 0.15)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                e.target.style.background = 'rgba(255, 255, 255, 0.1)'
              }}
            />
          </div>

          {/* Email (only for registration) */}
          {!isLogin && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: '#b8c5d6',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="Enter your email"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea'
                  e.target.style.background = 'rgba(255, 255, 255, 0.15)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)'
                }}
              />
            </div>
          )}

          {/* Display Name (only for registration) */}
          {!isLogin && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: '#b8c5d6',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                Display Name
              </label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                required
                placeholder="Enter your display name"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea'
                  e.target.style.background = 'rgba(255, 255, 255, 0.15)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)'
                }}
              />
            </div>
          )}

          {/* Password */}
          <div style={{ marginBottom: isLogin ? '20px' : '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              color: '#b8c5d6',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="Enter your password"
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea'
                e.target.style.background = 'rgba(255, 255, 255, 0.15)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                e.target.style.background = 'rgba(255, 255, 255, 0.1)'
              }}
            />
          </div>

          {/* Confirm Password (only for registration) */}
          {!isLogin && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                color: '#b8c5d6',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                placeholder="Confirm your password"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea'
                  e.target.style.background = 'rgba(255, 255, 255, 0.15)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)'
                }}
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? 'rgba(102, 126, 234, 0.5)' : 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              marginBottom: '20px'
            }}
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {/* Toggle Mode */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={toggleMode}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              fontSize: '0.9rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>

        {/* Divider */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          margin: '20px 0',
          color: '#b8c5d6'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.2)' }} />
          <span style={{ padding: '0 16px', fontSize: '0.9rem' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.2)' }} />
        </div>

        {/* Spectator Mode */}
        <div style={{ textAlign: 'center' }}>
          <button
            type="button"
            onClick={onSpectatorMode}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#b8c5d6',
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
              e.currentTarget.style.color = '#fff'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.color = '#b8c5d6'
            }}
          >
            Continue as Spectator
          </button>
        </div>

        {/* Demo Accounts */}
        <div style={{ 
          marginTop: '20px', 
          padding: '16px', 
          background: 'rgba(52, 152, 219, 0.1)', 
          border: '1px solid rgba(52, 152, 219, 0.3)', 
          borderRadius: '8px',
          fontSize: '0.8rem',
          color: '#87ceeb'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '8px' }}>Demo Accounts:</div>
          <div>Admin: admin / admin123</div>
          <div>Driver: testdriver / driver123</div>
        </div>
      </div>
    </div>
  )
}
