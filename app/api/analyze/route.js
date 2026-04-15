import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 30

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PROMPT = `この画像を分析してください。

【重要ルール】実際に料理・飲食物として提供されたリアルな写真のみを対象とする。
アニメ・イラスト・絵・CG・キャラクター・食べ物の絵が描かれた商品パッケージは、食べ物が写っていても0%とすること。
実際に撮影された本物の料理・飲食物のみを対象とする。

画像全体のうち、実際の食べ物・料理・飲み物が占める割合を0〜100%で推定してください。
必ず以下のJSON形式のみで返答してください（他のテキストは一切不要）：
{"food_percent": 数字, "reason": "日本語で一言"}`

export async function POST(req) {
  try {
    const { imageBase64, mediaType } = await req.json()
    if (!imageBase64) {
      return Response.json({ error: '画像データがありません' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: imageBase64 } },
          { type: 'text', text: PROMPT }
        ]
      }]
    })

    const raw = message.content[0].text.replace(/```json|```/g, '').trim()
    const match = raw.match(/\{[\s\S]*?\}/)
    const parsed = JSON.parse(match ? match[0] : raw)
    const pct = Math.round(Math.max(0, Math.min(100, Number(parsed.food_percent) || 0)))

    return Response.json({ food_percent: pct, reason: parsed.reason || '' })
  } catch (e) {
    console.error(e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
