// app/[locale]/account/upgrade/page.tsx

export default function UpgradePage() {
  return (
    <main
      className="
        mx-auto
        max-w-4xl
        
        /* 📱 Mobile: Reduce padding and reduce top and bottom margins */
        px-4 py-12 space-y-12
        
        /* 💻 Desktop: Generous spacing */
        md:py-20 md:space-y-16
      "
    >
      {/* =========================
          HEADER
      ========================= */}
      <section
        className="
          space-y-4 text-center md:space-y-6

          /* 📱 Mobile 전용 카드 스타일 */
          mt-8
          rounded-2xl
          border border-white/10
          bg-neutral-900/80
          shadow-[0_20px_60px_rgba(0,0,0,0.6)]
          p-6

          /* 💻 Desktop: 기존 구조 유지 (카드 제거) */
          md:mt-0
          md:rounded-none
          md:border-0
          md:bg-transparent
          md:shadow-none
          md:p-0
        "
      >
        <h1
          className="
            font-bold text-white
            
            /* 📱 Mobile: Reduce text */
            text-xl leading-snug
            
            /* 💻 Desktop: Maintain existing */
            md:text-4xl
          "
        >
          VIP 리스크 관측 시스템
           <br className="md:hidden" />
           이용 가이드
        </h1>

        <p
          className="
            mx-auto text-neutral-400
            
            /* 📱 Mobile: Focus on readability */
            text-sm leading-relaxed
            
            /* 💻 Desktop */
            md:text-base md:max-w-2xl
          "
        >
          이 시스템은 매수/매도 신호가 아닌 데이터 기반으로 위험 구간을 안내하여
          사용자의 손실을 줄이기위해서 설계되었습니다.
          <br className="md:hidden" />
        
        </p>
      </section>

      {/* =========================
          SYSTEM DESCRIPTION CARD
      ========================= */}
      <section
        className="
          rounded-2xl border border-zinc-800 bg-neutral-900/60
          
          /* 📱 Mobile: Reduce padding */
          p-5 space-y-4
          
          /* 💻 Desktop: Existing padding */
          md:p-8 md:space-y-6
        "
      >
        <h2
          className="
            font-semibold text-yellow-400
            
            /* 📱 */
            text-base
            
            /* 💻 */
            md:text-lg
          "
        >
          접근 등급: VIP 전용
        </h2>

        <p
          className="
            text-neutral-300
            
            /* 📱 */
            text-sm leading-relaxed
            
            /* 💻 */
            md:text-base
          "
        >
          실시간 고래 거래 강도, 미결제약정, 펀딩 비용, 변동성, 추세, 구조를 통합 분석하여
          시장의 위험 구간을 감지하는 AI 기반 리스크 관측 시스템입니다.
        </p>

        <ul
          className="
            text-neutral-400 space-y-2
            
            /* 📱 */
            text-sm
            
            /* 💻 */
            md:text-sm
          "
        >
          <li>• 실시간 청산 위험 감지</li>
          <li>• 고위험 구간 분류 브리핑</li>
          <li>• 내부 시나리오 판단 요약 제공</li>
        </ul>
      </section>

      {/* =========================
          CTA SECTION
      ========================= */}
      <section
        className="
          text-center
          
          /* 📱 */
          space-y-4
          
          /* 💻 */
          md:space-y-6
        "
      >
        <a
          href="/ko/casino/vip"
          className="
            inline-block
            rounded-xl
            bg-gradient-to-r
            from-yellow-500
            to-orange-500
            text-black
            font-semibold
            shadow-[0_0_40px_rgba(250,204,21,0.3)]
            transition-all
            
            /* 📱 Mobile: Button full width + larger touch area */
            w-full px-6 py-4 text-base
            
            /* 💻 Desktop: Original size */
            md:w-auto md:px-8 md:py-4 md:text-lg
            
            hover:scale-105
          "
        >
          VIP 전용 시스템 입장 →
        </a>

        <p
          className="
            text-neutral-500
            
            /* 📱 */
            text-[11px] leading-relaxed
            
            /* 💻 */
            md:text-xs
          "
        >
          본 시스템은 수익을 보장하지 않습니다.
          <br className="md:hidden" />
          AI 구조 분석 기반 브리핑 제공을 목적으로 합니다.
        </p>
      </section>
    </main>
  )
}
