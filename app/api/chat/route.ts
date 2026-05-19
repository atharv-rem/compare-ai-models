import { SarvamAIClient } from "sarvamai";

type Usage = {
  completion_tokens: number;
  prompt_tokens: number;
  total_tokens: number;
};

type SupportedModel = "sarvam-30b" | "sarvam-105b" | "sarvam-m";
type StreamChunk = {
  choices?: Array<{
    delta?: {
      content?: string | null;
    };
  }>;
  usage?: Usage | null;
};

type StreamEvent =
  | { type: "chunk"; content: string }
  | { type: "usage"; usage: Usage }
  | { type: "error"; error: { message: string; code: string; request_id?: string } }
  | { type: "done" };

const apiKey = process.env.SARVAM_API_KEY;

const client = apiKey
  ? new SarvamAIClient({
      apiSubscriptionKey: apiKey,
    })
  : null;

function createErrorPayload(
  message: string,
  code: string,
  requestId?: string,
) {
  return {
    error: {
      message,
      code,
      request_id: requestId,
    },
  };
}

function toResponseError(error: unknown) {
  if (error && typeof error === "object") {
    const maybeError = error as {
      statusCode?: number;
      body?: unknown;
      message?: string;
    };

    const body =
      maybeError.body && typeof maybeError.body === "object"
        ? (maybeError.body as {
            error?: {
              message?: string;
              code?: string;
              request_id?: string;
            };
          })
        : undefined;

    if (body?.error?.message) {
      return {
        status: maybeError.statusCode ?? 500,
        payload: createErrorPayload(
          body.error.message,
          body.error.code ?? "internal_server_error",
          body.error.request_id,
        ),
      };
    }

    if (typeof maybeError.statusCode === "number") {
      return {
        status: maybeError.statusCode,
        payload: createErrorPayload(
          maybeError.message ?? "Request failed.",
          maybeError.statusCode === 400
            ? "invalid_request_error"
            : maybeError.statusCode === 403
              ? "invalid_api_key_error"
              : maybeError.statusCode === 422
                ? "unprocessable_entity_error"
                : maybeError.statusCode === 429
                  ? "insufficient_quota_error"
                  : "internal_server_error",
        ),
      };
    }
  }

  return {
    status: 500,
    payload: createErrorPayload(
      error instanceof Error ? error.message : "Unexpected server error.",
      "internal_server_error",
    ),
  };
}

function encodeEvent(event: StreamEvent) {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
}

export async function POST(req: Request) {
  if (!client) {
    return Response.json(
      createErrorPayload(
        "Missing SARVAM_API_KEY in the server environment.",
        "invalid_api_key_error",
      ),
      { status: 500 },
    );
  }

  let body: { model?: string; message?: string };

  try {
    body = await req.json();
  } catch {
    return Response.json(
      createErrorPayload(
        "Malformed JSON body. Include a valid message payload.",
        "invalid_request_error",
      ),
      { status: 400 },
    );
  }

  if (!body.message || !body.model) {
    return Response.json(
      createErrorPayload(
        "Both 'message' and 'model' are required.",
        "invalid_request_error",
      ),
      { status: 400 },
    );
  }

  const supportedModels: SupportedModel[] = ["sarvam-30b", "sarvam-105b", "sarvam-m"];

  if (!supportedModels.includes(body.model as SupportedModel)) {
    return Response.json(
      createErrorPayload(
        "Invalid model name provided.",
        "unprocessable_entity_error",
      ),
      { status: 422 },
    );
  }

  const model = body.model as SupportedModel;

  let stream: AsyncIterable<StreamChunk>;

  try {
    stream = await client.chat.completions({
      model,
      stream: true,
      messages: [
        {
          role: "user",
          content: body.message,
        },
      ],
    }) as AsyncIterable<StreamChunk>;
  } catch (error) {
    const responseError = toResponseError(error);

    return Response.json(responseError.payload, {
      status: responseError.status,
    });
  }

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const content = chunk.choices?.[0]?.delta?.content ?? "";

          if (content) {
            controller.enqueue(
              encodeEvent({
                type: "chunk",
                content,
              }),
            );
          }

          if (chunk.usage) {
            controller.enqueue(
              encodeEvent({
                type: "usage",
                usage: {
                  completion_tokens: chunk.usage.completion_tokens,
                  prompt_tokens: chunk.usage.prompt_tokens,
                  total_tokens: chunk.usage.total_tokens,
                },
              }),
            );
          }
        }

        controller.enqueue(encodeEvent({ type: "done" }));
      } catch (error) {
        const responseError = toResponseError(error);

        controller.enqueue(
          encodeEvent({
            type: "error",
            error: responseError.payload.error,
          }),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
