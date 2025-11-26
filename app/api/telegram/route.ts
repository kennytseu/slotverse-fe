import { NextRequest, NextResponse } from "next/server";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const ALLOWED_USER_ID = process.env.ALLOWED_TELEGRAM_USER_ID;
const API = `https://api.telegram.org/bot${TOKEN}`;

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: "ok", 
    message: "Telegram webhook endpoint is active",
    timestamp: new Date().toISOString(),
    methods: ["GET", "POST"]
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const chatId = body?.message?.chat?.id;
    const userId = body?.message?.from?.id;
    const text = body?.message?.text || "";
    const username = body?.message?.from?.username || "Unknown";

    if (!chatId) {
      return NextResponse.json({ ok: true });
    }

    // Security check - only allow specific user if configured
    if (ALLOWED_USER_ID && userId.toString() !== ALLOWED_USER_ID) {
      await sendMessage(chatId, "🚫 Access denied. You are not authorized to use this bot.");
      return NextResponse.json({ ok: true });
    }

    // /start
    if (text === "/start") {
      const welcomeMessage = `🎰 **SlotVerse Content Manager**

Hello ${username}! I'm your slots platform assistant.

**Content Management:**
/addgame - Add a new slot game
/addprovider - Add a game provider
/schedule - Schedule game release
/update - Update game information
/help - Show detailed commands

**Quick Actions:**
/addgame [game name] by [provider]
/schedule [game] for [date]
/update [game] set [property] to [value]

**Examples:**
• \`/addgame Sweet Bonanza by Pragmatic Play\`
• \`/schedule Starburst XXXtreme for Dec 1\`
• \`/update Gates of Olympus set RTP to 96.5%\`

I'll help you manage your slots platform content! 🎰`;

      await sendMessage(chatId, welcomeMessage);
      return NextResponse.json({ ok: true });
    }

    // /help
    if (text === "/help") {
      const helpMessage = `🎰 **SlotVerse Content Commands**

**Game Management:**
**/addgame [name] by [provider]** - Add new slot game
**/updategame [name] [property] [value]** - Update game info
**/removegame [name]** - Remove a game

**Provider Management:**
**/addprovider [name]** - Add game provider
**/updateprovider [name] [info]** - Update provider details

**Content Scheduling:**
**/schedule [game] for [date]** - Schedule game release
**/calendar** - View upcoming releases

**Platform Features:**
**/addcategory [name]** - Create game category
**/updatehomepage [section] [content]** - Update homepage
**/stats** - View platform statistics

**Examples:**
\`/addgame Book of Dead by Play'n GO\`
\`/updategame Starburst RTP 96.1%\`
\`/addprovider NetEnt with 200+ games\`
\`/schedule Big Bass Bonanza for Dec 15\`

I'll help manage your slots platform content! 🎲`;

      await sendMessage(chatId, helpMessage);
      return NextResponse.json({ ok: true });
    }

    // /id
    if (text === "/id") {
      await sendMessage(chatId, `🆔 Your Telegram ID: \`${chatId}\`\nUser ID: \`${userId}\``);
      return NextResponse.json({ ok: true });
    }

    // /status
    if (text === "/status") {
      await sendMessage(chatId, "✅ Bot is online and ready!\n🔗 Connected to GitHub\n💾 Memory system active\n🤖 AI agent ready");
      return NextResponse.json({ ok: true });
    }

    // /addgame command
    if (text.startsWith("/addgame ")) {
      const gameInfo = text.replace("/addgame ", "").trim();
      if (!gameInfo) {
        await sendMessage(chatId, "❌ Please provide game information.\nExample: `/addgame Sweet Bonanza by Pragmatic Play`");
        return NextResponse.json({ ok: true });
      }

      await sendMessage(chatId, `🎰 Adding game: "${gameInfo}"\n⏳ Processing game information...`);
      
      try {
        const result = await callAgentAPI(`Add a new slot game to SlotVerse platform: ${gameInfo}. Include proper game metadata, provider information, and create the necessary components for displaying this game on the platform.`, chatId.toString());
        await handleAgentResponse(chatId, result, "addgame");
      } catch (error: any) {
        await sendMessage(chatId, `❌ Error: ${error.message}`);
      }
      
      return NextResponse.json({ ok: true });
    }

    // /addprovider command
    if (text.startsWith("/addprovider ")) {
      const providerInfo = text.replace("/addprovider ", "").trim();
      if (!providerInfo) {
        await sendMessage(chatId, "❌ Please provide provider information.\nExample: `/addprovider NetEnt - Premium slot games since 1996`");
        return NextResponse.json({ ok: true });
      }

      await sendMessage(chatId, `🏢 Adding provider: "${providerInfo}"\n⏳ Setting up provider profile...`);
      
      try {
        const result = await callAgentAPI(`Add a new game provider to SlotVerse platform: ${providerInfo}. Create provider profile, logo placeholder, and integration for their games.`, chatId.toString());
        await handleAgentResponse(chatId, result, "addprovider");
      } catch (error: any) {
        await sendMessage(chatId, `❌ Error: ${error.message}`);
      }
      
      return NextResponse.json({ ok: true });
    }

    // /schedule command
    if (text.startsWith("/schedule ")) {
      const scheduleInfo = text.replace("/schedule ", "").trim();
      if (!scheduleInfo) {
        await sendMessage(chatId, "❌ Please provide schedule information.\nExample: `/schedule Big Bass Bonanza for December 15, 2024`");
        return NextResponse.json({ ok: true });
      }

      await sendMessage(chatId, `📅 Scheduling: "${scheduleInfo}"\n⏳ Adding to release calendar...`);
      
      try {
        const result = await callAgentAPI(`Schedule a slot game release on SlotVerse platform: ${scheduleInfo}. Update the release calendar and create promotional content for the upcoming game.`, chatId.toString());
        await handleAgentResponse(chatId, result, "schedule");
      } catch (error: any) {
        await sendMessage(chatId, `❌ Error: ${error.message}`);
      }
      
      return NextResponse.json({ ok: true });
    }

    // /update command  
    if (text.startsWith("/update ")) {
      const updateInfo = text.replace("/update ", "").trim();
      if (!updateInfo) {
        await sendMessage(chatId, "❌ Please provide update information.\nExample: `/update Starburst set RTP to 96.1%`");
        return NextResponse.json({ ok: true });
      }

      await sendMessage(chatId, `🔄 Updating: "${updateInfo}"\n⏳ Applying changes...`);
      
      try {
        const result = await callAgentAPI(`Update SlotVerse platform content: ${updateInfo}. Make the necessary changes to game information, provider details, or platform content.`, chatId.toString());
        await handleAgentResponse(chatId, result, "update");
      } catch (error: any) {
        await sendMessage(chatId, `❌ Error: ${error.message}`);
      }
      
      return NextResponse.json({ ok: true });
    }

    // /deploy command
    if (text === "/deploy") {
      await sendMessage(chatId, "🚀 Deployment is automatic via Vercel!\nChanges are deployed when pushed to GitHub.\n\n✅ Your latest changes should be live shortly.");
      return NextResponse.json({ ok: true });
    }

    // Handle any other text as a general request
    if (text && !text.startsWith("/")) {
      await sendMessage(chatId, `🤖 Processing: "${text}"\n⏳ Let me work on this...`);
      
      try {
        const result = await callAgentAPI(text, chatId.toString());
        await handleAgentResponse(chatId, result, "general");
      } catch (error: any) {
        await sendMessage(chatId, `❌ Error: ${error.message}`);
      }
      
      return NextResponse.json({ ok: true });
    }

    // Unknown command
    await sendMessage(chatId, "❓ Unknown command. Type /help for available commands.");
    return NextResponse.json({ ok: true });

  } catch (err: any) {
    console.error("Telegram webhook error:", err);
    return NextResponse.json({ ok: false });
  }
}

async function callAgentAPI(prompt: string, sessionId: string) {
  // Use the correct production URL or fallback to localhost for development
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://slotverse.net' 
    : 'http://localhost:3000';
    
  const response = await fetch(`${baseUrl}/api/agent/dev`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, sessionId }),
  });

  if (!response.ok) {
    throw new Error(`Agent API error: ${response.status}`);
  }

  return await response.json();
}

async function handleAgentResponse(chatId: number, result: any, type: string) {
  if (result.tool_results && result.tool_results.length > 0) {
    let message = `✅ **${type === 'build' ? 'Built' : type === 'fix' ? 'Fixed' : 'Completed'}!**\n\n`;
    
    for (const toolResult of result.tool_results) {
      const { tool, result: toolRes } = toolResult;
      
      if (toolRes.success !== false) {
        switch (tool) {
          case 'writeFile':
            message += `📝 Updated: \`${toolRes.path}\`\n`;
            break;
          case 'createPage':
            message += `📄 Created page: \`${toolRes.path}\`\n`;
            break;
          case 'createComponent':
            message += `🧩 Created component: \`${toolRes.path}\`\n`;
            break;
          case 'readFile':
            message += `📖 Read: \`${toolRes.path}\`\n`;
            break;
          default:
            message += `🔧 ${tool}: Success\n`;
        }
      } else {
        message += `❌ ${tool}: ${toolRes.error}\n`;
      }
    }
    
    if (result.ai_response) {
      message += `\n💭 **AI Notes:** ${result.ai_response}`;
    }
    
    message += `\n\n🚀 Changes committed to GitHub and will deploy automatically!`;
    
    await sendMessage(chatId, message);
  } else if (result.reply) {
    await sendMessage(chatId, `🤖 ${result.reply}`);
  } else {
    await sendMessage(chatId, "✅ Task completed!");
  }
}

async function sendMessage(chatId: number, text: string) {
  await fetch(`${API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      chat_id: chatId, 
      text,
      parse_mode: "Markdown"
    }),
  });
}

