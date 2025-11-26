import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export async function saveMemory(key: string, value: any) {
  await redis.set(key, value);
}

export async function getMemory(key: string) {
  return await redis.get(key);
}

