import { useState, useEffect } from 'react'

interface User {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
}

interface LeaderboardEntry {
  username: string
  clicks: number
}

function App() {
  const [myClicks, setMyClicks] = useState(0)
  const [globalClicks, setGlobalClicks] = useState(0)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [time, setTime] = useState(new Date().toLocaleTimeString())

  useEffect(() => {
    // Update time every second
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString())
    }, 1000)

    // Initialize Telegram WebApp
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
      tg.expand()
      
      // Get user info
      const userData = tg.initDataUnsafe?.user
      if (userData) {
        setUser(userData as User)
      }
    }

    // Load initial data
    loadLeaderboard()
    loadUserStats()

    return () => clearInterval(interval)
  }, [])

  const loadLeaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard?limit=20')
      const data = await response.json()
      setLeaderboard(data.entries || [])
      setGlobalClicks(data.globalClicks || 0)
    } catch (error) {
      console.error('Failed to load leaderboard:', error)
    }
  }

  const loadUserStats = async () => {
    if (!user) return
    
    try {
      // This would be an API call to get user stats
      // For now, we'll simulate it
      setMyClicks(0)
    } catch (error) {
      console.error('Failed to load user stats:', error)
    }
  }

  const handleClick = async () => {
    if (isLoading) return

    setIsLoading(true)
    
    // Haptic feedback
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium')
    }

    try {
      // Get Telegram WebApp init data
      const initData = window.Telegram?.WebApp?.initData || ''
      
      // Send click to API
      const response = await fetch('/api/click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': initData
        },
        body: JSON.stringify({
          delta: 1,
          sequence: Date.now()
        })
      })

      if (response.ok) {
        setMyClicks(prev => prev + 1)
        
        // Update leaderboard periodically
        if (myClicks % 5 === 0) {
          loadLeaderboard()
        }
      }
    } catch (error) {
      console.error('Failed to send click:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ 
      padding: '20px', 
      textAlign: 'center',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        maxWidth: '400px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <h1 style={{ color: '#333', marginBottom: '10px' }}>🎮 Clicker Game</h1>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          {user ? `Welcome, ${user.first_name}!` : 'Welcome!'}
        </p>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <div style={{
            background: '#e3f2fd',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
              {myClicks}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Your Clicks</div>
          </div>
          
          <div style={{
            background: '#e8f5e8',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#388e3c' }}>
              {globalClicks}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Global Clicks</div>
          </div>
        </div>

        {/* Click Button */}
        <button 
          style={{
            padding: '20px 40px',
            fontSize: '24px',
            fontWeight: 'bold',
            background: isLoading ? '#ccc' : '#ff6b6b',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            marginBottom: '20px',
            width: '100%',
            transition: 'all 0.2s ease',
            transform: isLoading ? 'scale(0.95)' : 'scale(1)'
          }}
          onClick={handleClick}
          disabled={isLoading}
        >
          {isLoading ? '⏳' : '🎯 CLICK ME!'}
        </button>

        {/* Leaderboard */}
        <div style={{
          background: '#f8f9fa',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>🏆 Leaderboard</h3>
          
          {leaderboard.length === 0 ? (
            <p style={{ color: '#666', margin: '10px 0' }}>No players yet. Be the first!</p>
          ) : (
            <div style={{ textAlign: 'left' }}>
              {leaderboard.slice(0, 5).map((player, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '5px 0',
                  borderBottom: index < 4 ? '1px solid #eee' : 'none'
                }}>
                  <span style={{ fontWeight: 'bold' }}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'} 
                    {index + 1}. {player.username}
                  </span>
                  <span style={{ color: '#666' }}>{player.clicks}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status */}
        <div style={{
          fontSize: '12px',
          color: '#999',
          textAlign: 'center'
        }}>
          <div>Status: Ready • Time: {time}</div>
          <div>Telegram WebApp: {window.Telegram?.WebApp ? 'Connected' : 'Not Available'}</div>
        </div>
      </div>
    </div>
  )
}

export default App