import React from 'react'
import styled, { keyframes } from 'styled-components'

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--tg-theme-bg-color, #ffffff);
  padding: 20px;
`

const Logo = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--tg-theme-button-color, #2481cc), #1a73b8);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  animation: ${pulse} 2s ease-in-out infinite;
  
  &::before {
    content: '🎯';
    font-size: 32px;
  }
`

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid var(--tg-theme-secondary-bg-color, #f1f1f1);
  border-top: 3px solid var(--tg-theme-button-color, #2481cc);
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin-bottom: 16px;
`

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: var(--tg-theme-text-color, #000000);
  margin-bottom: 8px;
  text-align: center;
`

const Subtitle = styled.p`
  font-size: 16px;
  color: var(--tg-theme-hint-color, #999999);
  text-align: center;
  margin-bottom: 32px;
`

const LoadingScreen: React.FC = () => {
  return (
    <LoadingContainer>
      <Logo />
      <Title>Komic Clicker Test</Title>
      <Subtitle>Loading your game...</Subtitle>
      <Spinner />
    </LoadingContainer>
  )
}

export default LoadingScreen
