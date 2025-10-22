import { useState, useEffect } from 'react'

function App() {
  const [time, setTime] = useState(new Date().toLocaleTimeString())
  const [telegramStatus, setTelegramStatus] = useState('Checking...')
  const [userInfo, setUserInfo] = useState('')

  useEffect(() => {
    // Update time every second
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString())
    }, 1000)

    // Check Telegram WebApp
    if (window.Telegram?.WebApp) {
      setTelegramStatus('Available')
      
      // Initialize Telegram WebApp
      window.Telegram.WebApp.ready()
      window.Telegram.WebApp.expand()
      
      // Get user info
      const user = window.Telegram.WebApp.initDataUnsafe?.user
      if (user) {
        setUserInfo(`User ID: ${user.id}`)
      } else {
        setUserInfo('No user data')
      }
    } else {
      setTelegramStatus('Not Available')
      setUserInfo('Development Mode')
    }

    return () => clearInterval(interval)
  }, [])

  const testClick = () => {
    alert('Button clicked! React WebApp is working!')
  }

  const showAlert = () => {
    alert('This is a test alert from React WebApp!')
  }

  return (
    <div style={{ 
      padding: '20px', 
      textAlign: 'center',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h1 style={{ color: '#333', marginBottom: '20px' }}>🎮 Komic Clicker Test</h1>
        <p>React version - Working!</p>
        
        <div style={{
          margin: '20px 0',
          padding: '15px',
          background: '#e9ecef',
          borderRadius: '5px',
          textAlign: 'left'
        }}>
          <p><strong>Status:</strong> <span style={{ fontWeight: 'bold', color: '#28a745' }}>Ready</span></p>
          <p><strong>Time:</strong> {time}</p>
          <p><strong>Telegram WebApp:</strong> {telegramStatus}</p>
          <p><strong>User Info:</strong> {userInfo}</p>
        </div>
        
        <button 
          style={{
            padding: '15px 30px',
            fontSize: '18px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            margin: '10px',
            width: '100%'
          }}
          onClick={testClick}
        >
          Test Click
        </button>
        
        <button 
          style={{
            padding: '15px 30px',
            fontSize: '18px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            margin: '10px',
            width: '100%'
          }}
          onClick={showAlert}
        >
          Show Alert
        </button>
      </div>
    </div>
  )
}

export default App