import React from 'react'
import styled, { keyframes } from 'styled-components'
import { motion } from 'framer-motion'

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`

const ripple = keyframes`
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
`

const ClickButtonContainer = styled(motion.button)<{ $isAnimating: boolean }>`
  width: 200px;
  height: 200px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, var(--tg-theme-button-color, #2481cc), #1a73b8);
  color: var(--tg-theme-button-text-color, #ffffff);
  font-size: 24px;
  font-weight: 700;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(36, 129, 204, 0.3);
  transition: all 0.2s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(36, 129, 204, 0.4);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 4px 20px rgba(36, 129, 204, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  ${props => props.$isAnimating && `
    animation: ${pulse} 0.3s ease-in-out;
  `}
`

const ButtonIcon = styled.div`
  font-size: 48px;
  line-height: 1;
`

const ButtonText = styled.div`
  font-size: 16px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
`

const RippleEffect = styled.div<{ $x: number; $y: number }>`
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: scale(0);
  animation: ${ripple} 0.6s linear;
  left: ${props => props.$x}px;
  top: ${props => props.$y}px;
  width: 20px;
  height: 20px;
  margin-left: -10px;
  margin-top: -10px;
`

interface ClickButtonProps {
  onClick: () => void
  disabled?: boolean
  isAnimating?: boolean
}

const ClickButton: React.FC<ClickButtonProps> = ({ 
  onClick, 
  disabled = false, 
  isAnimating = false 
}) => {
  const [ripples, setRipples] = React.useState<Array<{ id: number; x: number; y: number }>>([])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const newRipple = {
      id: Date.now(),
      x,
      y,
    }

    setRipples(prev => [...prev, newRipple])

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id))
    }, 600)

    onClick()
  }

  return (
    <ClickButtonContainer
      onClick={handleClick}
      disabled={disabled}
      $isAnimating={isAnimating}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <ButtonIcon>🎯</ButtonIcon>
      <ButtonText>Click Me!</ButtonText>
      
      {ripples.map(ripple => (
        <RippleEffect
          key={ripple.id}
          $x={ripple.x}
          $y={ripple.y}
        />
      ))}
    </ClickButtonContainer>
  )
}

export default ClickButton
