import { kv } from "@vercel/kv";

export async function saveMemory(key: string, value: any) {
  await kv.set(key, value);
}

export async function getMemory(key: string) {
  return await kv.get(key);
}

