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
      const welcomeMessage = `🤖 **SlotVerse AI Developer Bot**

Hello ${username}! I'm your autonomous developer assistant.

**Available Commands:**
/help - Show this help message
/id - Get your Telegram ID
/status - Check bot status
/build [description] - Build something new
/fix [description] - Fix an issue
/deploy - Deploy current changes

**Examples:**
• \`/build a contact form component\`
• \`/fix the navigation menu styling\`
• \`/build an API endpoint for user registration\`

Just describe what you want, and I'll code it for you! 🚀`;

      await sendMessage(chatId, welcomeMessage);
      return NextResponse.json({ ok: true });
    }

    // /help
    if (text === "/help") {
      const helpMessage = `🛠️ **AI Developer Commands**

**/build [description]** - Create new features
**/fix [description]** - Fix bugs or issues  
**/deploy** - Deploy current changes
**/status** - Check system status
**/id** - Get your user ID

**Example Usage:**
\`/build a user dashboard with charts\`
\`/fix responsive design on mobile\`
\`/build API for user authentication\`

The AI will analyze your request, write the code, and commit it to GitHub automatically! ⚡`;

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

    // /build command
    if (text.startsWith("/build ")) {
      const request = text.replace("/build ", "").trim();
      if (!request) {
        await sendMessage(chatId, "❌ Please provide a description of what to build.\nExample: `/build a contact form component`");
        return NextResponse.json({ ok: true });
      }

      await sendMessage(chatId, `🔨 Building: "${request}"\n⏳ Please wait while I work on this...`);
      
      try {
        const result = await callAgentAPI(`Build this: ${request}`, chatId.toString());
        await handleAgentResponse(chatId, result, "build");
      } catch (error: any) {
        await sendMessage(chatId, `❌ Error: ${error.message}`);
      }
      
      return NextResponse.json({ ok: true });
    }

    // /fix command
    if (text.startsWith("/fix ")) {
      const request = text.replace("/fix ", "").trim();
      if (!request) {
        await sendMessage(chatId, "❌ Please provide a description of what to fix.\nExample: `/fix the navigation menu styling`");
        return NextResponse.json({ ok: true });
      }

      await sendMessage(chatId, `🔧 Fixing: "${request}"\n⏳ Analyzing and fixing the issue...`);
      
      try {
        const result = await callAgentAPI(`Fix this issue: ${request}`, chatId.toString());
        await handleAgentResponse(chatId, result, "fix");
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

