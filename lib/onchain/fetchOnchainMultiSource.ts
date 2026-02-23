/* =========================================================
   Multi-Source On-chain RSS Fetcher (Institutional Grade v2)
   - Multi Source Aggregation
   - 48h Freshness Filter
   - Collect Top N Items
   - Server-only
========================================================= */

import Parser from 'rss-parser'

if (typeof window !== 'undefined') {
  throw new Error('[Onchain Multi RSS] server-only module')
}

const parser = new Parser({ timeout: 10000 })

export interface ExternalOnchainRssItem {
  title: string
  link: string
  content: string
  pubDate: string
  source: string
}

/* =========================================================
   🔥 확장된 기관 RSS 목록
========================================================= */

const ONCHAIN_RSS_SOURCES = [
  { name: 'Glassnode', url: 'https://insights.glassnode.com/rss/' },
  { name: 'CryptoQuant', url: 'https://cryptoquant.com/blog/rss.xml' },
  { name: 'CoinMetrics', url: 'https://coinmetrics.io/blog/feed/' },
  { name: 'Santiment', url: 'https://santiment.net/blog/rss/' },

  // 🔥 추가 기관
  { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/' },
  { name: 'TheBlock', url: 'https://www.theblock.co/rss.xml' },
  { name: 'IntoTheBlock', url: 'https://blog.intotheblock.com/rss/' },
  { name: 'Messari', url: 'https://messari.io/rss' },
]

const MAX_AGE_HOURS = 48
const MAX_ITEMS = 5 // 🔥 최대 수집 기사 수

function isFresh(pubDate?: string) {
  if (!pubDate) return false
  const date = new Date(pubDate)
  if (isNaN(date.getTime())) return false

  const diff =
    (Date.now() - date.getTime()) / (1000 * 60 * 60)

  return diff <= MAX_AGE_HOURS
}

/* =========================================================
   🔥 다중 RSS 수집 함수
========================================================= */

export async function fetchOnchainMultiSource():
  Promise<ExternalOnchainRssItem[]> {

  const collected: ExternalOnchainRssItem[] = []

  for (const source of ONCHAIN_RSS_SOURCES) {
    try {
      const feed = await parser.parseURL(source.url)

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

        if (collected.length >= MAX_ITEMS) break
      }

    } catch (err) {
      console.warn(
        `[Onchain RSS] Failed: ${source.name}`,
        err
      )
    }

    if (collected.length >= MAX_ITEMS) break
  }

  if (collected.length === 0) {
    console.warn('[Onchain RSS] No fresh institutional reports found')
  }

  /* =========================================================
     🔥 최신순 정렬
  ========================================================= */

  return collected.sort((a, b) =>
    new Date(b.pubDate).getTime() -
    new Date(a.pubDate).getTime()
  )
}