import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// 如果未配置，返回一个 URL/key 均为占位符的客户端
// 所有实际请求会因 URL 无效而失败，store.ts 内部通过 isSupabaseConfigured 短路避免调用
export function createClient() {
  return createBrowserClient(url || "https://placeholder.supabase.co", key || "placeholder");
}
