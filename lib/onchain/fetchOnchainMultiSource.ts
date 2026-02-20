/* =========================================================
   Multi-Source On-chain RSS Fetcher (Institutional Grade)
   - Sequential Failover
   - 48h Freshness Filter
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

const ONCHAIN_RSS_SOURCES = [
  {
    name: 'Glassnode',
    url: 'https://insights.glassnode.com/rss/',
  },
  {
    name: 'CryptoQuant',
    url: 'https://cryptoquant.com/blog/rss.xml',
  },
  {
    name: 'CoinMetrics',
    url: 'https://coinmetrics.io/blog/feed/',
  },
  {
    name: 'Santiment',
    url: 'https://santiment.net/blog/rss/',
  },
]

const MAX_AGE_HOURS = 48

function isFresh(pubDate?: string) {
  if (!pubDate) return false
  const date = new Date(pubDate)
  if (isNaN(date.getTime())) return false

  const diff =
    (Date.now() - date.getTime()) / (1000 * 60 * 60)

  return diff <= MAX_AGE_HOURS
}

export async function fetchOnchainMultiSource():
  Promise<ExternalOnchainRssItem | null> {

  for (const source of ONCHAIN_RSS_SOURCES) {
    try {
      const feed = await parser.parseURL(source.url)

      if (!feed.items?.length) continue

      for (const item of feed.items) {
        if (isFresh(item.pubDate)) {
          return {
            title: item.title ?? '',
            link: item.link ?? '',
            content:
              item.contentSnippet ||
              item.content ||
              '',
            pubDate: item.pubDate ?? '',
            source: source.name,
          }
        }
      }

      console.log(
        `[Onchain RSS] ${source.name} no fresh items`
      )
    } catch (err) {
      console.warn(
        `[Onchain RSS] Failed: ${source.name}`,
        err
      )
    }
  }

  console.warn('[Onchain RSS] All sources failed or stale')
  return null
}
