import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { useTelegram } from '../hooks/useTelegram'
import { useAppStore } from '../store/appStore'
import toast from 'react-hot-toast'
import ClickButton from '../components/ClickButton'
import StatsCard from '../components/StatsCard'
import LeaderboardCard from '../components/LeaderboardCard'

const GameContainer = styled.div`
  min-height: 100vh;
  background: var(--tg-theme-bg-color, #ffffff);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const Header = styled.div`
  text-align: center;
  margin-bottom: 20px;
`

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: var(--tg-theme-text-color, #000000);
  margin-bottom: 8px;
  background: linear-gradient(135deg, var(--tg-theme-button-color, #2481cc), #1a73b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`

const Subtitle = styled.p`
  font-size: 16px;
  color: var(--tg-theme-hint-color, #999999);
  margin-bottom: 16px;
`

const GameArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 32px;
  min-height: 400px;
`

const ClickArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
`

const ClickCounter = styled(motion.div)`
  font-size: 48px;
  font-weight: 700;
  color: var(--tg-theme-text-color, #000000);
  text-align: center;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  width: 100%;
  max-width: 400px;
`

const LeaderboardSection = styled.div`
  width: 100%;
  max-width: 400px;
`

const GamePage: React.FC = () => {
  const { getUser, hapticFeedback, notificationFeedback } = useTelegram()
  const { 
    myClicks, 
    globalClicks, 
    leaderboard, 
    isLoading, 
    error,
    sendClick, 
    fetchLeaderboard 
  } = useAppStore()
  
  const [clickCount, setClickCount] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const user = getUser()

  useEffect(() => {
    if (user) {
      useAppStore.getState().setUser({
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        username: user.username,
        languageCode: user.language_code,
        isPremium: user.is_premium,
      })
    }
    fetchLeaderboard()
  }, [user, fetchLeaderboard])

  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

  const handleClick = async () => {
    if (isLoading) return

    const newClickCount = clickCount + 1
    setClickCount(newClickCount)
    setIsAnimating(true)
    
    // Haptic feedback
    hapticFeedback('medium')
    
    // Send click to API every 5 clicks or immediately for first click
    if (newClickCount === 1 || newClickCount % 5 === 0) {
      try {
        await sendClick(newClickCount === 1 ? 1 : 5)
        notificationFeedback('success')
        
        if (newClickCount % 5 === 0) {
          toast.success(`+5 clicks sent! Total: ${myClicks + (newClickCount === 1 ? 1 : 5)}`)
          setClickCount(0) // Reset local counter
        }
      } catch (error) {
        notificationFeedback('error')
        toast.error('Failed to send clicks')
      }
    }
    
    setTimeout(() => setIsAnimating(false), 200)
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <GameContainer>
      <Header>
        <Title>Komic Clicker Test</Title>
        <Subtitle>
          {user ? `Welcome, ${user.first_name}!` : 'Tap to start clicking!'}
        </Subtitle>
      </Header>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '32px' }}
      >
        <GameArea>
          <ClickArea>
            <ClickCounter
              key={clickCount}
              initial={{ scale: 1 }}
              animate={{ 
                scale: isAnimating ? 1.1 : 1,
                color: isAnimating ? 'var(--tg-theme-button-color)' : 'var(--tg-theme-text-color)'
              }}
              transition={{ duration: 0.2 }}
            >
              {clickCount}
            </ClickCounter>
            
            <ClickButton 
              onClick={handleClick}
              disabled={isLoading}
              isAnimating={isAnimating}
            />
          </ClickArea>

          <StatsGrid>
            <motion.div variants={itemVariants}>
              <StatsCard
                title="Your Clicks"
                value={myClicks}
                icon="👤"
                color="var(--tg-theme-button-color)"
              />
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <StatsCard
                title="Global Clicks"
                value={globalClicks}
                icon="🌍"
                color="var(--success-color)"
              />
            </motion.div>
          </StatsGrid>
        </GameArea>

        <LeaderboardSection>
          <motion.div variants={itemVariants}>
            <LeaderboardCard 
              leaderboard={leaderboard}
              isLoading={isLoading}
              onRefresh={fetchLeaderboard}
            />
          </motion.div>
        </LeaderboardSection>
      </motion.div>
    </GameContainer>
  )
}

export default GamePage
