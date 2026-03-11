'use client'

type SoundType =
  | 'signal'
  | 'typing'

class VIPSoundSystem {

  private unlocked = false

  private pool: Record<SoundType, HTMLAudioElement[]> = {
    signal: [],
    typing: []
  }

  private index: Record<SoundType, number> = {
    signal: 0,
    typing: 0
  }

  constructor() {

    if (typeof window === 'undefined') return

    this.createPool('signal', '/sounds/signal.mp3')
    this.createPool('typing', '/sounds/typing.mp3')

    this.setupUnlock()
  }

  /* =========================
     Audio Pool
  ========================= */

  private createPool(type: SoundType, src: string) {

    const size = 5

    for (let i = 0; i < size; i++) {

      const audio = new Audio(src)
      audio.preload = 'auto'
      audio.volume = 0.7

      this.pool[type].push(audio)
    }
  }

  /* =========================
     Mobile Unlock
  ========================= */

  private setupUnlock() {

    const unlock = () => {

      if (this.unlocked) return

      Object.values(this.pool).flat().forEach(a => {

        a.volume = 0
        a.play().catch(() => {})
        a.pause()
        a.currentTime = 0

      })

      this.unlocked = true

      window.removeEventListener('touchstart', unlock)
      window.removeEventListener('click', unlock)
    }

    window.addEventListener('touchstart', unlock)
    window.addEventListener('click', unlock)
  }

  /* =========================
     Play
  ========================= */

  play(type: SoundType) {

    if (!this.unlocked) return

    const pool = this.pool[type]

    const i = this.index[type]

    const audio = pool[i]

    audio.currentTime = 0
    audio.play().catch(() => {})

    this.index[type] = (i + 1) % pool.length
  }

}

export const vipSound = new VIPSoundSystem()
