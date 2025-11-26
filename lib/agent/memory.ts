import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Save memory
export async function saveMemory(key: string, value: any) {
  await redis.set(key, JSON.stringify(value));
}

// Load memory
export async function loadMemory(key: string) {
  const data = await redis.get<string>(key);
  return data ? JSON.parse(data) : null;
}

