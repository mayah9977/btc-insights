'use client'

import { useState } from 'react'
import type { VIPLevel } from '@/lib/vip/vipTypes'

export default function AdminVIPPage() {
  const [userId, setUserId] = useState('')
  const [level, setLevel] = useState<VIPLevel>('VIP')
  const [priceId, setPriceId] = useState('')
  const [loading, setLoading] = useState(false)

  const callAPI = async (body: any) => {
    try {
      setLoading(true)

      const res = await fetch('/api/admin/vip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || '에러 발생')
        return
      }

      alert('처리 완료')
    } catch (e) {
      console.error(e)
      alert('요청 실패')
    } finally {
      setLoading(false)
    }
  }

  /** 1️⃣ Admin Override */
  const applyAdminVIP = () => {
    if (!userId) return alert('userId 입력')

    callAPI({
      action: 'override',
      userId,
      level,
    })
  }

  /** 2️⃣ 강제 만료 */
  const forceExpire = () => {
    if (!userId) return alert('userId 입력')

    callAPI({
      action: 'expire',
      userId,
    })
  }

  /** 3️⃣ 복구 */
  const recoverVIP = () => {
    if (!userId || !priceId) {
      return alert('userId + priceId 입력')
    }

    callAPI({
      action: 'recover',
      userId,
      priceId,
    })
  }

  return (
    <main style={{ padding: 24, maxWidth: 480 }}>
      <h1>👑 Admin VIP Control</h1>

      <input
        placeholder="userId"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        style={{ width: '100%', marginTop: 12 }}
      />

      <select
        value={level}
        onChange={(e) => setLevel(e.target.value as VIPLevel)}
        style={{ width: '100%', marginTop: 12 }}
      >
        <option value="FREE">FREE</option>
        <option value="VIP">VIP</option>
      </select>

      <button
        style={{ width: '100%', marginTop: 12 }}
        onClick={applyAdminVIP}
        disabled={loading}
      >
        Admin Override 적용
      </button>

      <hr style={{ margin: '24px 0' }} />

      <button
        style={{ width: '100%' }}
        onClick={forceExpire}
        disabled={loading}
      >
        강제 만료 (Expire)
      </button>

      <hr style={{ margin: '24px 0' }} />

      <input
        placeholder="priceId (MONTHLY / YEAR)"
        value={priceId}
        onChange={(e) => setPriceId(e.target.value)}
        style={{ width: '100%', marginTop: 12 }}
      />

      <button
        style={{ width: '100%', marginTop: 12 }}
        onClick={recoverVIP}
        disabled={loading}
      >
        VIP 복구 (Recover)
      </button>
    </main>
  )
}
