/* =========================================================
   Market Context - RSS Fetcher
   - Fetch Binance + Coinbase RSS
   - Return top 3~5 headlines
   - Server-only
========================================================= */

import Parser from 'rss-parser'

if (typeof window !== 'undefined') {
  throw new Error('[RSS] fetchRssNews imported on client. Forbidden.')
}

const parser = new Parser({
  timeout: 10000,
})

/* =========================================================
   RSS Sources
========================================================= */

const RSS_SOURCES = [
  {
    name: 'CoinDesk',
    url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
  }
]

/* =========================================================
   Types
========================================================= */

export interface HeadlineItem {
  source: string
  title: string
  link?: string
  pubDate?: string
}

/* =========================================================
   Main Fetch Function
========================================================= */

export async function fetchRssNews(): Promise<HeadlineItem[]> {
  try {
    const allItems: HeadlineItem[] = []

    for (const source of RSS_SOURCES) {
      try {
        const feed = await parser.parseURL(source.url)

        const items =
          feed.items?.slice(0, 3).map(item => ({
            source: source.name,
            title: item.title ?? '',
            link: item.link,
            pubDate: item.pubDate,
          })) ?? []

        allItems.push(...items)
      } catch (err) {
        console.warn(`[RSS] Failed to fetch ${source.name}`, err)
      }
    }

    // 정렬: 최신순
    allItems.sort((a, b) => {
      const aTime = a.pubDate ? new Date(a.pubDate).getTime() : 0
      const bTime = b.pubDate ? new Date(b.pubDate).getTime() : 0
      return bTime - aTime
    })

    // 최종 5개만 반환
    return allItems.slice(0, 5)
  } catch (error) {
    console.error('[RSS] Unexpected error:', error)
    return []
  }
}
