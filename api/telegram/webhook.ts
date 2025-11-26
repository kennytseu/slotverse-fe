import { NextRequest, NextResponse } from "next/server";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const API = `https://api.telegram.org/bot${TOKEN}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const chatId = body?.message?.chat?.id;
    const text = body?.message?.text || "";

    if (!chatId) {
      return NextResponse.json({ ok: true });
    }

    // /start
    if (text === "/start") {
      await sendMessage(chatId, "👋 Hello! Your bot webhook is working correctly.");
      return NextResponse.json({ ok: true });
    }

    // /id
    if (text === "/id") {
      await sendMessage(chatId, `Your Telegram ID: ${chatId}`);
      return NextResponse.json({ ok: true });
    }

    // default reply
    await sendMessage(chatId, `You said: ${text}`);
    return NextResponse.json({ ok: true });

  } catch (err: any) {
    console.error("Telegram webhook error:", err);
    return NextResponse.json({ ok: false });
  }
}

async function sendMessage(chatId: number, text: string) {
  await fetch(`${API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

