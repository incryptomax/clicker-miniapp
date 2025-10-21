import React, { useEffect } from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'
import { useAppStore } from '../store/appStore'
import LeaderboardCard from '../components/LeaderboardCard'
import LoadingScreen from '../components/LoadingScreen'

const PageContainer = styled.div`
  min-height: 100vh;
  background: var(--tg-theme-bg-color, #ffffff);
  padding: 16px;
  display: flex;
  flex-direction: column;
`

const Header = styled.div`
  text-align: center;
  margin-bottom: 24px;
`

const Title = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: var(--tg-theme-text-color, #000000);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  
  &::before {
    content: '🏆';
    font-size: 32px;
  }
`

const Subtitle = styled.p`
  font-size: 16px;
  color: var(--tg-theme-hint-color, #999999);
`

const LeaderboardContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
`

const LeaderboardPage: React.FC = () => {
  const { leaderboard, isLoading, fetchLeaderboard } = useAppStore()

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  if (isLoading && leaderboard.length === 0) {
    return <LoadingScreen />
  }

  return (
    <PageContainer>
      <Header>
        <Title>Leaderboard</Title>
        <Subtitle>Top players by clicks</Subtitle>
      </Header>

      <LeaderboardContainer>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', maxWidth: '400px' }}
        >
          <LeaderboardCard
            leaderboard={leaderboard}
            isLoading={isLoading}
            onRefresh={fetchLeaderboard}
          />
        </motion.div>
      </LeaderboardContainer>
    </PageContainer>
  )
}

export default LeaderboardPage
