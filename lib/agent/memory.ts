import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export async function saveMemory(key: string, value: any) {
  await redis.set(key, JSON.stringify(value));
  return true;
}

export async function getMemory(key: string) {
  const result = await redis.get(key);
  if (typeof result === 'string') {
    try {
      return JSON.parse(result);
    } catch {
      return result;
    }
  }
  return result;
}

export async function deleteMemory(key: string) {
  await redis.del(key);
  return true;
}

export async function listMemoryKeys(pattern: string = "*") {
  return await redis.keys(pattern);
}

// Agent-specific memory helpers
export async function saveAgentTask(taskId: string, task: any) {
  return saveMemory(`agent:task:${taskId}`, task);
}

export async function getAgentTask(taskId: string) {
  return getMemory(`agent:task:${taskId}`);
}

export async function saveAgentHistory(sessionId: string, entry: any) {
  const historyKey = `agent:history:${sessionId}`;
  const history = await getMemory(historyKey) || [];
  history.push({
    ...entry,
    timestamp: new Date().toISOString()
  });
  return saveMemory(historyKey, history);
}

export async function getAgentHistory(sessionId: string) {
  return getMemory(`agent:history:${sessionId}`) || [];
}

