import React from 'react'
import styled from 'styled-components'
import { motion } from 'framer-motion'

const Card = styled(motion.div)`
  background: var(--tg-theme-bg-color, #ffffff);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--tg-theme-secondary-bg-color, #f1f1f1);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  min-height: 120px;
  justify-content: center;
`

const Icon = styled.div<{ $color: string }>`
  font-size: 32px;
  margin-bottom: 8px;
  color: ${props => props.$color};
`

const Title = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: var(--tg-theme-hint-color, #999999);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const AnimatedValue = styled(motion.div)<{ $color: string }>`
  font-size: 24px;
  font-weight: 700;
  color: ${props => props.$color};
  line-height: 1;
`

interface StatsCardProps {
  title: string
  value: number
  icon: string
  color: string
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, color }) => {
  return (
    <Card
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      <Icon $color={color}>{icon}</Icon>
      <Title>{title}</Title>
      <AnimatedValue
        $color={color}
        key={value}
        initial={{ scale: 1.2, opacity: 0.7 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {value.toLocaleString()}
      </AnimatedValue>
    </Card>
  )
}

export default StatsCard
