import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'

const Card = styled(motion.div)`
  background: var(--tg-theme-bg-color, #ffffff);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--tg-theme-secondary-bg-color, #f1f1f1);
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`

const Title = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: var(--tg-theme-text-color, #000000);
  display: flex;
  align-items: center;
  gap: 8px;
  
  &::before {
    content: '🏆';
    font-size: 20px;
  }
`

const RefreshButton = styled.button`
  background: none;
  border: none;
  color: var(--tg-theme-hint-color, #999999);
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: var(--tg-theme-secondary-bg-color, #f1f1f1);
    color: var(--tg-theme-button-color, #2481cc);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const LeaderboardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const LeaderboardItem = styled(motion.div)<{ $rank: number }>`
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  background: ${props => {
    if (props.$rank === 1) return 'linear-gradient(135deg, #ffd700, #ffed4e)'
    if (props.$rank === 2) return 'linear-gradient(135deg, #c0c0c0, #e5e5e5)'
    if (props.$rank === 3) return 'linear-gradient(135deg, #cd7f32, #daa520)'
    return 'var(--tg-theme-secondary-bg-color, #f8f9fa)'
  }};
  border: 1px solid ${props => {
    if (props.$rank <= 3) return 'transparent'
    return 'var(--tg-theme-secondary-bg-color, #e9ecef)'
  }};
`

const Rank = styled.div<{ $rank: number }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  margin-right: 12px;
  background: ${props => {
    if (props.$rank === 1) return '#ffd700'
    if (props.$rank === 2) return '#c0c0c0'
    if (props.$rank === 3) return '#cd7f32'
    return 'var(--tg-theme-button-color, #2481cc)'
  }};
  color: ${props => {
    if (props.$rank <= 3) return '#000000'
    return '#ffffff'
  }};
`

const UserInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`

const Username = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: var(--tg-theme-text-color, #000000);
  margin-bottom: 2px;
`

const UserId = styled.div`
  font-size: 12px;
  color: var(--tg-theme-hint-color, #999999);
`

const Clicks = styled.div`
  font-weight: 700;
  font-size: 16px;
  color: var(--tg-theme-text-color, #000000);
`

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: var(--tg-theme-hint-color, #999999);
`

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`

const EmptyText = styled.div`
  font-size: 16px;
  margin-bottom: 8px;
`

const EmptySubtext = styled.div`
  font-size: 14px;
  opacity: 0.7;
`

const LoadingState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: var(--tg-theme-hint-color, #999999);
`

const LoadingSpinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid var(--tg-theme-secondary-bg-color, #f1f1f1);
  border-top: 3px solid var(--tg-theme-button-color, #2481cc);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

interface LeaderboardEntry {
  rank: number
  username: string
  clicks: number
  tgUserId: string
}

interface LeaderboardCardProps {
  leaderboard: LeaderboardEntry[]
  isLoading: boolean
  onRefresh: () => void
}

const LeaderboardCard: React.FC<LeaderboardCardProps> = ({ 
  leaderboard, 
  isLoading, 
  onRefresh 
}) => {
  const handleRefresh = () => {
    onRefresh()
  }

  return (
    <Card
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Header>
        <Title>Leaderboard</Title>
        <RefreshButton onClick={handleRefresh} disabled={isLoading}>
          🔄
        </RefreshButton>
      </Header>

      {isLoading ? (
        <LoadingState>
          <LoadingSpinner />
          <div>Loading leaderboard...</div>
        </LoadingState>
      ) : leaderboard.length === 0 ? (
        <EmptyState>
          <EmptyIcon>🏆</EmptyIcon>
          <EmptyText>No players yet</EmptyText>
          <EmptySubtext>Be the first to start clicking!</EmptySubtext>
        </EmptyState>
      ) : (
        <LeaderboardList>
          {leaderboard.map((entry, index) => (
            <LeaderboardItem
              key={entry.tgUserId}
              $rank={entry.rank}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Rank $rank={entry.rank}>
                {entry.rank <= 3 ? (
                  ['🥇', '🥈', '🥉'][entry.rank - 1]
                ) : (
                  entry.rank
                )}
              </Rank>
              <UserInfo>
                <Username>{entry.username}</Username>
                <UserId>ID: {entry.tgUserId}</UserId>
              </UserInfo>
              <Clicks>{entry.clicks.toLocaleString()}</Clicks>
            </LeaderboardItem>
          ))}
        </LeaderboardList>
      )}
    </Card>
  )
}

export default LeaderboardCard
