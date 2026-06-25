const MODEL = "deepseek-chat";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// 优先走服务端代理（隐藏 key），降级到直连（需传 apiKey）
async function doFetch(
  messages: ChatMessage[],
  streaming: boolean,
  apiKey?: string,
): Promise<Response> {
  const body = JSON.stringify({ model: MODEL, messages, stream: streaming, max_tokens: 512, temperature: 0.6 });

  // 服务端代理（Vercel 部署时 / 本地配置了环境变量时）
  const proxyRes = await fetch("/api/ai-proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  }).catch(() => null);

  if (proxyRes && proxyRes.status !== 503) return proxyRes;

  // 降级：直连 DeepSeek（本地开发，用 localStorage 里的 key）
  if (!apiKey) throw new Error("未配置 DeepSeek API Key，请在设置页填写或在服务端配置环境变量。");

  return fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body,
  });
}

async function readStream(res: Response, onChunk: (chunk: string) => void): Promise<string> {
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = dec.decode(value, { stream: true });
    for (const line of text.split("\n")) {
      if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const delta = (JSON.parse(line.slice(6)) as any).choices?.[0]?.delta?.content ?? "";
        if (delta) { full += delta; onChunk(delta); }
      } catch { /* malformed SSE chunk */ }
    }
  }
  return full;
}

export async function chat(
  messages: ChatMessage[],
  apiKey?: string,
  onChunk?: (chunk: string) => void,
): Promise<string> {
  const streaming = Boolean(onChunk);
  const res = await doFetch(messages, streaming, apiKey);

  if (!res.ok) {
    const errText = await res.text().catch(() => String(res.status));
    throw new Error(`AI ${res.status}: ${errText}`);
  }

  if (streaming && onChunk) return readStream(res, onChunk);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await res.json()) as any;
  return data.choices?.[0]?.message?.content ?? "";
}

export function parseJsonResponse<T>(raw: string): T | null {
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  try { return JSON.parse(cleaned) as T; }
  catch { return null; }
}
