import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components'
import { useTelegram } from './hooks/useTelegram'
import { useAppStore } from './store/appStore'
import GamePage from './pages/GamePage'
import LeaderboardPage from './pages/LeaderboardPage'
import LoadingScreen from './components/LoadingScreen'

// Global styles
const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background: var(--tg-theme-bg-color, #ffffff);
    color: var(--tg-theme-text-color, #000000);
    overflow-x: hidden;
  }

  #root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
`

// Theme
const theme = {
  colors: {
    primary: '#2481cc',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
  },
}

const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--tg-theme-bg-color, #ffffff);
  color: var(--tg-theme-text-color, #000000);
`

function App() {
  const { initTelegram, isReady } = useTelegram()
  const { isLoading, initializeApp } = useAppStore()

  useEffect(() => {
    initTelegram()
    initializeApp()
  }, [initTelegram, initializeApp])

  if (!isReady || isLoading) {
    return <LoadingScreen />
  }

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <AppContainer>
        <Router>
          <Routes>
            <Route path="/" element={<GamePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
          </Routes>
        </Router>
      </AppContainer>
    </ThemeProvider>
  )
}

export default App
