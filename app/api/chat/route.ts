import { SarvamAIClient } from "sarvamai"

const client = new SarvamAIClient({
  apiSubscriptionKey: process.env.SARVAM_API_KEY!,
})

export async function POST(req: Request) {
  const body = await req.json()

  const stream = await client.chat.completions({
    model: body.model,
    stream: true,
    messages: [
      {
        role: "user",
        content: body.message,
      },
    ],
  })

  const encoder = new TextEncoder()

  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const token =
          chunk.choices?.[0]?.delta?.content || ""

        controller.enqueue(encoder.encode(token))
      }

      controller.close()
    },
  })

  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  })
}