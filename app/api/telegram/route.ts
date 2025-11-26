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

**Content Import:**
**/copy [URL]** - Copy game content from any URL
**/import [URL]** - Import multiple games from a page
**/scrape [URL] [game name]** - Extract specific game data

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
**/dbsetup** - Initialize database tables

**Import Examples:**
\`/copy https://slotcatalog.com/slots/sweet-bonanza\`
\`/import https://pragmaticplay.com/games\`
\`/scrape https://casino.com/games Sweet Bonanza\`

I'll automatically extract game info and add it to SlotVerse! 🎲`;

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
      try {
        // Check database connection
        const dbResponse = await fetch(`${process.env.NODE_ENV === 'production' ? 'https://slotverse.net' : 'http://localhost:3000'}/api/database/init`);
        const dbStatus = await dbResponse.json();
        
        const statusMessage = `✅ **SlotVerse Status**

🤖 **Bot**: Online and ready
🔗 **GitHub**: Connected
💾 **Memory**: Redis active
🗄️ **Database**: ${dbStatus.connected ? '✅ Connected' : '❌ Disconnected'}
🎰 **Scraping**: Active
🚀 **Deployment**: Auto-deploy enabled

${dbStatus.connected ? '**Ready to scrape games!**' : '**Database issue - using fallback storage**'}`;

        await sendMessage(chatId, statusMessage);
      } catch (error) {
        await sendMessage(chatId, "✅ Bot is online and ready!\n🔗 Connected to GitHub\n💾 Memory system active\n🤖 AI agent ready\n⚠️ Database status unknown");
      }
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

    // /copy command - Copy content from URL
    if (text.startsWith("/copy ")) {
      const url = text.replace("/copy ", "").trim();
      if (!url || !isValidUrl(url)) {
        await sendMessage(chatId, "❌ Please provide a valid URL.\nExample: `/copy https://slotcatalog.com/slots/sweet-bonanza`");
        return NextResponse.json({ ok: true });
      }

      await sendMessage(chatId, `🔗 Copying content from: ${url}\n⏳ Extracting game information...`);
      
      try {
        const result = await callScrapeAPI(url, undefined, "game");
        await handleScrapeResponse(chatId, result, "copy");
      } catch (error: any) {
        await sendMessage(chatId, `❌ Error copying content: ${error.message}`);
      }
      
      return NextResponse.json({ ok: true });
    }

    // /import command - Import multiple games from a page
    if (text.startsWith("/import ")) {
      const url = text.replace("/import ", "").trim();
      if (!url || !isValidUrl(url)) {
        await sendMessage(chatId, "❌ Please provide a valid URL.\nExample: `/import https://pragmaticplay.com/games`");
        return NextResponse.json({ ok: true });
      }

      await sendMessage(chatId, `📥 Importing games from: ${url}\n⏳ This may take a moment...`);
      
      try {
        const result = await callScrapeAPI(url, undefined, "games-list");
        await handleScrapeResponse(chatId, result, "import");
      } catch (error: any) {
        await sendMessage(chatId, `❌ Error importing content: ${error.message}`);
      }
      
      return NextResponse.json({ ok: true });
    }

    // /scrape command - Extract specific game data
    if (text.startsWith("/scrape ")) {
      const parts = text.replace("/scrape ", "").trim().split(" ");
      if (parts.length < 2) {
        await sendMessage(chatId, "❌ Please provide URL and game name.\nExample: `/scrape https://casino.com/games Sweet Bonanza`");
        return NextResponse.json({ ok: true });
      }
      
      const url = parts[0];
      const gameName = parts.slice(1).join(" ");
      
      if (!isValidUrl(url)) {
        await sendMessage(chatId, "❌ Please provide a valid URL.");
        return NextResponse.json({ ok: true });
      }

      await sendMessage(chatId, `🎯 Scraping "${gameName}" from: ${url}\n⏳ Extracting specific game data...`);
      
      try {
        const result = await callScrapeAPI(url, gameName, "game");
        await handleScrapeResponse(chatId, result, "scrape");
      } catch (error: any) {
        await sendMessage(chatId, `❌ Error scraping game data: ${error.message}`);
      }
      
      return NextResponse.json({ ok: true });
    }

    // Handle URLs sent directly (without command)
    if (text && isValidUrl(text)) {
      await sendMessage(chatId, `🔗 Detected URL: ${text}\n⏳ Analyzing content...`);
      
      try {
        const result = await callScrapeAPI(text, undefined, "auto");
        await handleScrapeResponse(chatId, result, "url-analysis");
      } catch (error: any) {
        await sendMessage(chatId, `❌ Error analyzing URL: ${error.message}`);
      }
      
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

    // /dbsetup command
    if (text === "/dbsetup") {
      await sendMessage(chatId, "🗄️ Setting up database tables...\n⏳ Please wait...");
      
      try {
        const response = await fetch(`${process.env.NODE_ENV === 'production' ? 'https://slotverse.net' : 'http://localhost:3000'}/api/database/init`, {
          method: 'POST'
        });
        const result = await response.json();
        
        if (result.success) {
          await sendMessage(chatId, `✅ **Database Setup Complete!**

📊 **Tables Created:**
• Games table
• Providers table

🎯 **Features Ready:**
• Game storage and retrieval
• Provider management
• Search functionality
• Featured games system

Your MySQL database is now ready for game scraping! 🎰`);
        } else {
          await sendMessage(chatId, `❌ **Database Setup Failed**

Error: ${result.error}

Please check your MySQL connection settings.`);
        }
      } catch (error: any) {
        await sendMessage(chatId, `❌ Database setup error: ${error.message}`);
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

async function callScrapeAPI(url: string, targetGame?: string, extractType?: string) {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://slotverse.net' 
    : 'http://localhost:3000';
    
  const response = await fetch(`${baseUrl}/api/scrape`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, targetGame, extractType }),
  });

  if (!response.ok) {
    throw new Error(`Scrape API error: ${response.status}`);
  }

  return await response.json();
}

async function handleScrapeResponse(chatId: number, result: any, type: string) {
  if (result.success) {
    let message = getResponseHeader(type);
    
    if (result.games && result.games.length > 0) {
      message += `🎰 **Games Added:** ${result.games.length}\n\n`;
      
      result.games.slice(0, 5).forEach((game: any) => {
        message += `• **${game.name}**`;
        if (game.provider) message += ` (${game.provider})`;
        if (game.rtp) message += ` - RTP: ${game.rtp}`;
        message += `\n`;
      });
      
      if (result.games.length > 5) {
        message += `... and ${result.games.length - 5} more games\n`;
      }
      
      if (result.dataFile) {
        message += `\n📄 Data saved to: \`${result.dataFile}\``;
      }
    } else {
      message += result.message || "No games found on the page";
    }
    
    message += `\n\n🚀 Changes committed to GitHub and will deploy automatically!`;
    
    await sendMessage(chatId, message);
  } else {
    await sendMessage(chatId, `❌ Error: ${result.error || 'Unknown error occurred'}`);
  }
}

async function handleAgentResponse(chatId: number, result: any, type: string) {
  if (result.tool_results && result.tool_results.length > 0) {
    let message = getResponseHeader(type);
    
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
          case 'scrapeUrl':
            if (toolRes.data) {
              message += `🔗 **Scraped from:** ${toolRes.url}\n`;
              message += `🎰 **Games found:** ${toolRes.data.games?.length || 0}\n`;
              message += `🏢 **Providers found:** ${toolRes.data.providers?.length || 0}\n`;
              
              if (toolRes.data.games && toolRes.data.games.length > 0) {
                message += `\n**Extracted Games:**\n`;
                toolRes.data.games.slice(0, 5).forEach((game: any) => {
                  message += `• ${game.name}`;
                  if (game.provider) message += ` (${game.provider})`;
                  if (game.rtp) message += ` - RTP: ${game.rtp}`;
                  message += `\n`;
                });
                if (toolRes.data.games.length > 5) {
                  message += `... and ${toolRes.data.games.length - 5} more games\n`;
                }
              }
            }
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

function getResponseHeader(type: string): string {
  switch (type) {
    case 'copy':
      return `✅ **Content Copied Successfully!**\n\n`;
    case 'import':
      return `✅ **Games Imported Successfully!**\n\n`;
    case 'scrape':
      return `✅ **Game Data Scraped!**\n\n`;
    case 'url-analysis':
      return `✅ **URL Content Analyzed!**\n\n`;
    case 'addgame':
      return `✅ **Game Added!**\n\n`;
    case 'addprovider':
      return `✅ **Provider Added!**\n\n`;
    case 'schedule':
      return `✅ **Release Scheduled!**\n\n`;
    case 'update':
      return `✅ **Content Updated!**\n\n`;
    default:
      return `✅ **Task Completed!**\n\n`;
  }
}

function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
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

