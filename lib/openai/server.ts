/* =========================================================
   OpenAI Server Module
   - Server-only usage
   - Node 18+ required (fetch native)
   - Never import from client components
========================================================= */

if (typeof window !== 'undefined') {
  throw new Error('[OpenAI] server module imported on client. Forbidden.')
}

if (!process.env.OPENAI_API_KEY) {
  throw new Error('[OpenAI] OPENAI_API_KEY is not defined')
}

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'

type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface GenerateOptions {
  model?: string
  temperature?: number
  maxTokens?: number
}

/* =========================================================
   Core Chat Function
========================================================= */

export async function generateChatCompletion(
  messages: ChatMessage[],
  options: GenerateOptions = {}
) {
  const {
    model = 'gpt-4o-mini', // 비용 효율 모델 (뉴스 요약용 적합)
    temperature = 0.4,
    maxTokens = 800,
  } = options

  const response = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[OpenAI] API Error:', errorText)
    throw new Error('OpenAI API request failed')
  }

  const data = await response.json()

  return data.choices?.[0]?.message?.content ?? ''
}
