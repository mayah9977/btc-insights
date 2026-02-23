/* =========================================================
   Institutional Multi RSS Fetcher (Parallel Version)
   - Promise.allSettled 기반 병렬 수집
   - 48시간 Freshness 필터
   - 실패 허용 구조
   - 중복 제거
   - 최신순 정렬
========================================================= */

import Parser from 'rss-parser'

if (typeof window !== 'undefined') {
  throw new Error('[Onchain Multi RSS] server-only module')
}

const parser = new Parser({ timeout: 10000 })

/* =========================================================
   타입 정의
========================================================= */

export interface ExternalOnchainRssItem {
  title: string
  link: string
  content: string
  pubDate: string
  source: string
}

/* =========================================================
   기관 RSS 목록 (확장 가능)
========================================================= */

const ONCHAIN_RSS_SOURCES = [
  { name: 'Glassnode', url: 'https://insights.glassnode.com/rss/' },
  { name: 'CryptoQuant', url: 'https://cryptoquant.com/blog/rss.xml' },
  { name: 'CoinMetrics', url: 'https://coinmetrics.io/blog/feed/' },
  { name: 'Santiment', url: 'https://santiment.net/blog/rss/' },
  { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/' },
  { name: 'TheBlock', url: 'https://www.theblock.co/rss.xml' },
  { name: 'IntoTheBlock', url: 'https://blog.intotheblock.com/rss/' },
  { name: 'Messari', url: 'https://messari.io/rss' },
]

const MAX_AGE_HOURS = 48
const MAX_ITEMS = 5

/* =========================================================
   48시간 필터
========================================================= */

function isFresh(pubDate?: string) {
  if (!pubDate) return false
  const date = new Date(pubDate)
  if (isNaN(date.getTime())) return false

  const diffHours =
    (Date.now() - date.getTime()) / (1000 * 60 * 60)

  return diffHours <= MAX_AGE_HOURS
}

/* =========================================================
   병렬 RSS 수집
========================================================= */

export async function fetchOnchainMultiList():
  Promise<ExternalOnchainRssItem[]> {

  /* 🔥 1️⃣ 병렬 실행 */
  const results = await Promise.allSettled(
    ONCHAIN_RSS_SOURCES.map(source =>
      parser.parseURL(source.url)
        .then(feed => ({ source, feed }))
    )
  )

  const collected: ExternalOnchainRssItem[] = []

  /* 🔥 2️⃣ 성공한 것만 처리 */
  for (const result of results) {
    if (result.status !== 'fulfilled') continue

    const { source, feed } = result.value

    if (!feed.items?.length) continue

    for (const item of feed.items) {

      if (!isFresh(item.pubDate)) continue

      collected.push({
        title: item.title ?? '',
        link: item.link ?? '',
        content:
          item.contentSnippet ||
          item.content ||
          '',
        pubDate: item.pubDate ?? '',
        source: source.name,
      })
    }
  }

  if (collected.length === 0) {
    console.warn('[Onchain RSS] No fresh institutional reports found')
    return []
  }

  /* =========================================================
     🔥 3️⃣ 중복 제거 (title 기준)
  ========================================================= */

  const uniqueMap = new Map<string, ExternalOnchainRssItem>()

  for (const item of collected) {
    if (!uniqueMap.has(item.title)) {
      uniqueMap.set(item.title, item)
    }
  }

  const uniqueItems = Array.from(uniqueMap.values())

  /* =========================================================
     🔥 4️⃣ 최신순 정렬
  ========================================================= */

  uniqueItems.sort(
    (a, b) =>
      new Date(b.pubDate).getTime() -
      new Date(a.pubDate).getTime()
  )

  /* =========================================================
     🔥 5️⃣ 최대 N개 반환
  ========================================================= */

  return uniqueItems.slice(0, MAX_ITEMS)
}