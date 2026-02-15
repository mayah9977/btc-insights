import React from 'react'

export type ActionGateState = 'OBSERVE' | 'CAUTION' | 'IGNORE'

interface ActionGateStatusProps {
  state: ActionGateState
}

const STATE_CONFIG: Record<
  ActionGateState,
  {
    icon: string
    text: string
    color: string
  }
> = {
  OBSERVE: {
    icon: '👁',
    text: 'AI is observing the current market situation in real time. (AI가 실시간으로 현재 시장 상황을 관찰중입니다.)',
    color: '#4A6FA5', // neutral blue
  },
  CAUTION: {
    icon: '◔',
    text: 'AI is observing the current market situation in real time. (AI가 실시간으로 현재 시장 상황을 관찰중입니다.)',
    color: '#B89B5E', // muted amber
  },
  IGNORE: {
    icon: '⊘',
    text: 'AI is observing the current market situation in real time. (AI가 실시간으로 현재 시장 상황을 관찰중입니다.)',
    color: '#7A7A7A', // neutral gray
  },
}

export const ActionGateStatus: React.FC<ActionGateStatusProps> = ({
  state,
}) => {
  const config = STATE_CONFIG[state]

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        borderRadius: '6px',
        backgroundColor: '#F5F6F7',
        color: config.color,
        fontSize: '13px',
        lineHeight: 1.4,
        userSelect: 'none',
      }}
      aria-label="Action Gate Status"
    >
      <span
        style={{
          fontSize: '14px',
          lineHeight: 1,
        }}
        aria-hidden
      >
        {config.icon}
      </span>

      <span>{config.text}</span>
    </div>
  )
}