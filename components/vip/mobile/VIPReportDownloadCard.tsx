//components/vip/mobile/VIPReportDownloadCard.tsx

'use client'

export default function VIPReportDownloadCard() {
  const handleTelegramConnect = () => {
    window.open(
      'https://t.me/YOUR_TELEGRAM_BOT_USERNAME',
      '_blank'
    )
  }

  return (
    <div className="px-4">
      <div
        className="
        relative
        overflow-hidden
        rounded-2xl
        border
        border-[#C6A55B]/15
        bg-[linear-gradient(180deg,rgba(18,18,18,0.96)_0%,rgba(10,10,10,0.98)_100%)]
        px-4
        py-4
        shadow-[0_10px_40px_rgba(0,0,0,0.45)]
        backdrop-blur-xl
        transition
        "
      >
        {/* subtle premium glow */}
        <div
          className="
          pointer-events-none
          absolute
          inset-0
          bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.08),transparent_35%)]
          "
        />

        {/* top line */}
        <div
          className="
          absolute
          left-4
          right-4
          top-0
          h-px
          bg-gradient-to-r
          from-transparent
          via-[#D4AF37]/40
          to-transparent
          "
        />

        <div className="relative flex items-start gap-3">
          {/* icon */}
          <div
            className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            border
            border-[#D4AF37]/15
            bg-white/[0.03]
            text-[18px]
            shadow-inner
            "
          >
            📩
          </div>

          {/* content */}
          <div className="min-w-0 flex-1">
            {/* title */}
            <div
              className="
              flex
              items-center
              gap-2
              "
            >
              <span
                className="
                text-[13px]
                font-semibold
                tracking-[0.04em]
                text-[#F3D98B]
                "
              >
                VIP Daily Report
              </span>

              <span
                className="
                rounded-full
                border
                border-[#D4AF37]/20
                bg-[#D4AF37]/10
                px-2
                py-[2px]
                text-[9px]
                font-semibold
                uppercase
                tracking-[0.12em]
                text-[#D4AF37]
                "
              >
                VIP
              </span>
            </div>

            {/* description */}
            <div
              className="
              mt-2
              text-[11px]
              leading-relaxed
              text-white/55
              "
            >
              매일 오전 7시, 주요 뉴스 브리핑과 온체인 데이터,
              세력 흐름 분석 리포트를 Telegram으로 자동 전송합니다.
            </div>

            {/* intelligence items */}
            <div
              className="
              mt-3
              space-y-2
              "
            >
              <div
                className="
                flex
                items-center
                gap-2
                text-[11px]
                text-white/72
                "
              >
                <div
                  className="
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-[#D4AF37]/80
                  "
                />

                <span>
                  Daily macro & crypto intelligence summary
                </span>
              </div>

              <div
                className="
                flex
                items-center
                gap-2
                text-[11px]
                text-white/72
                "
              >
                <div
                  className="
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-[#D4AF37]/80
                  "
                />

                <span>
                  On-chain liquidity & whale activity tracking
                </span>
              </div>

              <div
                className="
                flex
                items-center
                gap-2
                text-[11px]
                text-white/72
                "
              >
                <div
                  className="
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-[#D4AF37]/80
                  "
                />

                <span>
                  Institutional flow analysis report
                </span>
              </div>
            </div>

            {/* button */}
            <button
              onClick={handleTelegramConnect}
              className="
              mt-4
              flex
              w-full
              items-center
              justify-center
              rounded-xl
              border
              border-[#D4AF37]/15
              bg-white/[0.04]
              py-2.5
              text-[11px]
              font-semibold
              tracking-[0.03em]
              text-[#F3D98B]
              shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]
              transition-all
              duration-200
              active:scale-[0.985]
              "
            >
              Telegram Bot 연결하기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
