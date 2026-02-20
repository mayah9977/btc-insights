/* =========================================================
   External On-chain RSS Fetcher
   - 하루 1회 cron 전용
   - 서버 전용
========================================================= */

import Parser from 'rss-parser'

if (typeof window !== 'undefined') {
  throw new Error('[Onchain RSS] server-only module')
}

const parser = new Parser({
  timeout: 10000,
})

export interface ExternalOnchainRssItem {
  title: string
  link: string
  content: string
  pubDate: string
  source: string
}

/**
 * 현재는 CryptoQuant Blog RSS 기준
 * 필요시 다른 RSS 추가 가능
 */
const RSS_FEED_URL = 'https://insights.glassnode.com/rss/'

export async function fetchOnchainRss(): Promise<ExternalOnchainRssItem | null> {
  try {
    const feed = await parser.parseURL(RSS_FEED_URL)

    if (!feed.items?.length) return null

    const latest = feed.items[0]

    return {
      title: latest.title ?? '',
      link: latest.link ?? '',
      content:
        latest.contentSnippet ||
        latest.content ||
        '',
      pubDate: latest.pubDate ?? '',
      source: 'CryptoQuant',
    }
  } catch (err) {
    console.error('[Onchain RSS ERROR]', err)
    return null
  }
}
