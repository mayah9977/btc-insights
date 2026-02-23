'use client'
import React from 'react'

export type ActionGateState = 'OBSERVE' | 'CAUTION' | 'IGNORE'

interface ActionGateStatusProps {
  state: ActionGateState
}

export const ActionGateStatus: React.FC<ActionGateStatusProps> = ({
  state,
}) => {
  return (
    <>
      <style>
        {`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }

        @keyframes scanMove {
          0% { left: 0%; }
          100% { left: 100%; }
        }

        @keyframes glowPulse {
          0% { box-shadow: 0 0 10px rgba(0,255,200,0.4); }
          50% { box-shadow: 0 0 25px rgba(0,255,200,0.8); }
          100% { box-shadow: 0 0 10px rgba(0,255,200,0.4); }
        }

        @keyframes textBlink {
          from { opacity: 0.7; }
          to { opacity: 1; }
        }
      `}
      </style>

      <div
        aria-label="Action Gate Status"
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '10px',
          padding: '16px 20px',
          color: '#fff',
          fontSize: '15px', 
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          background:
            'linear-gradient(90deg, red, orange, yellow, green, cyan, blue, violet)',
          backgroundSize: '400% 400%',
          animation:
            'gradientShift 8s linear infinite, glowPulse 3s ease-in-out infinite',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* 스캔 라인 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: '2px',
            background: 'rgba(255,255,255,0.9)',
            animation: 'scanMove 3s linear infinite',
            pointerEvents: 'none',
          }}
        />

        <span
          style={{
            zIndex: 1,
            animation: 'textBlink 1.5s infinite alternate',
          }}
        >
          AI is observing the current market situation in real time.
          (AI가 실시간으로 현재 시장 상황을 관찰중입니다.)
        </span>
      </div>
    </>
  )
}
