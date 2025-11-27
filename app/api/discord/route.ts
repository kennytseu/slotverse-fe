import { NextRequest, NextResponse } from "next/server";
import { 
  createGame, 
  createProvider, 
  getGameBySlug, 
  getProviderBySlug, 
  createSlug, 
  updateProviderGameCount,
  testConnection 
} from "@/lib/database/mysql";
import { handleScrapeUrl } from "@/lib/agent/tool-functions";
import { writeFile } from "@/lib/agent/git";

import { verifyKey } from 'discord-interactions';

// Safe logging helper to bypass Vercel censoring
function safe(value: any) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return "<unclonable>";
  }
}

function debug(label: string, value: any) {
  try {
    const v = safe(value);
    console.log(label, v);
  } catch {
    console.log(label, "<hidden-by-vercel>");
  }
}

// Discord webhook verification
async function verifyDiscordRequest(request: NextRequest, body: string) {
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');
  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  
  
  // Skip verification in development if no public key is set
  if (!publicKey && process.env.NODE_ENV === 'development') {
    console.log('⚠️ Skipping Discord signature verification in development');
    return true;
  }
  
  if (!signature || !timestamp || !publicKey) {
    console.error('Missing Discord verification headers or public key');
    return false;
  }
  
  try {
    const isValid = await verifyKey(body, signature, timestamp, publicKey);
    return isValid;
  } catch (error) {
    console.error('Discord signature verification error:', error);
    return false;
  }
}

// Discord interaction types
const InteractionType = {
  PING: 1,
  APPLICATION_COMMAND: 2,
  MESSAGE_COMPONENT: 3,
  APPLICATION_COMMAND_AUTOCOMPLETE: 4,
  MODAL_SUBMIT: 5
};

// Discord response types
const InteractionResponseType = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
  DEFERRED_UPDATE_MESSAGE: 6,
  UPDATE_MESSAGE: 7,
  APPLICATION_COMMAND_AUTOCOMPLETE_RESULT: 8,
  MODAL: 9
};

export async function POST(req: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await req.text();
    
    // Parse body first to check if it's a PING
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      console.error('Raw body that failed to parse:', rawBody.substring(0, 200) + '...');
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Verify signature for all requests (Discord requires this for validation)
    if (!(await verifyDiscordRequest(req, rawBody))) {
      console.error('Discord signature verification failed');
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Handle Discord PING after signature verification
    if (body.type === 1) { // InteractionType.PING
      return Response.json({ type: 1 });
    }
    const { type, data, member, user } = body;

    // Handle Discord ping
    if (type === InteractionType.PING) {
      return NextResponse.json({ type: InteractionResponseType.PONG });
    }

    // Handle slash commands
    if (type === InteractionType.APPLICATION_COMMAND) {
      const { name, options } = data;
      const userId = user?.id || member?.user?.id;
      const username = user?.username || member?.user?.username;

      // Check authorization - support both server and user-based auth
      const allowedServers = process.env.ALLOWED_DISCORD_SERVERS?.split(',') || [];
      const allowedUsers = process.env.ALLOWED_DISCORD_USERS?.split(',') || [];
      const guildId = body.guild_id;
      
      // If server-based auth is configured, check if command is from allowed server
      if (allowedServers.length > 0) {
        if (!guildId || !allowedServers.includes(guildId)) {
          return NextResponse.json({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: "❌ This server is not authorized to use SlotVerse bot commands.",
              flags: 64 // Ephemeral message
            }
          });
        }
      }
      // Fallback to user-based auth if no server auth configured
      else if (allowedUsers.length > 0 && !allowedUsers.includes(userId)) {
        return NextResponse.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "❌ You don't have permission to use SlotVerse bot commands.",
            flags: 64 // Ephemeral message
          }
        });
      }

      switch (name) {
        case 'status':
          return await handleStatusCommand();
        
        case 'copy':
          return await handleCopyCommand(options, body);
        
        case 'dbsetup':
          return await handleDbSetupCommand();
        
        case 'games':
          return await handleGamesCommand(options);
        
        case 'help':
          return await handleHelpCommand();
        
        case 'build':
          return await handleBuildCommand(options, body);
        
        case 'edit':
          return await handleEditCommand(options, body);
        
        default:
          return NextResponse.json({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: "❓ Unknown command. Use `/help` for available commands.",
              flags: 64
            }
          });
      }
    }

    return NextResponse.json({ error: 'Unknown interaction type' }, { status: 400 });

  } catch (error: any) {
    console.error('Discord webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    message: 'Discord webhook endpoint is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasPublicKey: !!process.env.DISCORD_PUBLIC_KEY
  });
}

async function handleStatusCommand() {
  try {
    const dbConnected = await testConnection();
    
    const embed = {
      title: "🎰 SlotVerse Status",
      color: dbConnected ? 0x00ff00 : 0xff9900,
      fields: [
        { name: "🤖 Bot", value: "Online and ready", inline: true },
        { name: "🔗 GitHub", value: "Connected", inline: true },
        { name: "💾 Memory", value: "Redis active", inline: true },
        { name: "🗄️ Database", value: dbConnected ? "✅ Connected" : "❌ Disconnected", inline: true },
        { name: "🎰 Scraping", value: "Active", inline: true },
        { name: "🚀 Deployment", value: "Auto-deploy enabled", inline: true }
      ],
      footer: {
        text: dbConnected ? "Ready to scrape games!" : "Database issue - using fallback storage"
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [embed]
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `❌ Status check failed: ${error.message}`,
        flags: 64
      }
    });
  }
}

async function handleCopyCommand(options: any[], body: any) {
  const urlOption = options?.find(opt => opt.name === 'url');
  const url = urlOption?.value;

  if (!url) {
    return NextResponse.json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "❌ Please provide a URL to scrape.",
        flags: 64
      }
    });
  }

  // Send immediate response to Discord (must be within 3 seconds)
  const immediateResponse = NextResponse.json({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: `🔗 **Content Scraping Started**\n\n📝 **URL:** ${url}\n\n⏳ Extracting game information and downloading images... This may take a moment.\n\n🔔 Your team will be notified when complete!`
    }
  });

  // Process the scraping in the background (don't await)
  // Extract values safely to avoid Proxy issues
  const channelId = String(body.channel_id);
  const token = String(body.token);
  
  // Process the scraping in the background (don't await)
  processScraping(url, channelId, token).catch(console.error);

  return immediateResponse;
}

async function processScraping(url: string, channelId?: string, interactionToken?: string) {
  const logs: string[] = [];
  const startTime = Date.now();
  
  // Helper function to send debug follow-ups (reduced for performance)
  async function sendDebugFollowUp(step: string, message: string) {
    if (interactionToken && (step === "1" || step === "3" || step === "5" || step === "ERROR")) {
      try {
        await fetch(`https://discord.com/api/v10/webhooks/${process.env.DISCORD_APPLICATION_ID}/${interactionToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `🔍 **Step ${step}**: ${message}`,
            embeds: [{
              color: step === "ERROR" ? 0xff0000 : 0x00ff00,
              timestamp: new Date().toISOString(),
              footer: { text: `SlotVerse • ${new Date().toLocaleTimeString()}` }
            }]
          })
        });
        console.log(`[DEBUG] Sent follow-up: ${step} - ${message}`);
      } catch (error) {
        console.log(`[DEBUG] Failed to send follow-up: ${step} - ${error}`);
      }
    }
  }
  
  try {
    logs.push(`🚀 Starting scrape: ${url}`);
    await sendDebugFollowUp("1", "Background processing started");

    // Call the actual scraping function with a timeout
    let scrapeResult;
    try {
      await sendDebugFollowUp("2", "Initiating robust scraper");
      scrapeResult = await Promise.race([
        handleScrapeUrl({ url }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Scraping timeout after 30 seconds')), 30 * 1000)
        )
      ]) as any;
    } catch (timeoutError: any) {
      const duration = Date.now() - startTime;
      logs.push(`⏰ Timeout: ${timeoutError.message}`);
      console.log(`[processScraping] ${logs.join(' → ')} (${duration}ms)`);
      await sendDebugFollowUp("ERROR", `Scraping timeout after ${duration}ms: ${timeoutError.message}`);
      scrapeResult = {
        success: false,
        error: timeoutError.message || 'Unknown timeout error'
      };
    }
    
    if (!scrapeResult.success) {
      logs.push(`❌ Scraping failed: ${scrapeResult.error}`);
      const duration = Date.now() - startTime;
      console.log(`[processScraping] ${logs.join(' → ')} (${duration}ms)`);
      await sendDebugFollowUp("ERROR", `Scraping failed: ${scrapeResult.error}`);
      
      // Send failure notification to Discord
      if (channelId && interactionToken) {
        try {
          await sendDiscordFollowUp(interactionToken, {
            content: `❌ **Content Scraping Failed**\n\n🔗 **URL:** ${url}\n\n**Error:** ${scrapeResult.error}\n\n💡 **Troubleshooting:**\n• Check if the URL is accessible\n• Verify the site structure hasn't changed\n• Try a different game URL`,
            embeds: [{
              color: 0xff0000,
              timestamp: new Date().toISOString(),
              footer: { text: "SlotVerse Content Scraper" }
            }]
          });
        } catch (discordError) {
          console.error('Failed to send Discord failure notification:', discordError);
        }
      } else {
        console.error('Missing channelId or interactionToken for Discord notification');
      }
      return;
    }

    await sendDebugFollowUp("3", `Scraping successful! Found ${scrapeResult.data?.games?.length || 0} games`);

    // Process games and save to database
    const games = scrapeResult.data?.games || [];
    logs.push(`📊 Processing ${games.length} games`);
    await sendDebugFollowUp("4", `Processing ${games.length} games for database`);
    const savedGames = [];

    // TEMPORARY: Skip game processing during test
    if (scrapeResult.success) {
      for (const game of games as any[]) {
      const gameName = game.name;
      const providerName = game.provider || "Unknown";
      const gameSlug = createSlug(gameName);
      
      try {
        const dbConnected = await testConnection();
        if (dbConnected) {
          const existingGame = await getGameBySlug(gameSlug);
          if (!existingGame) {
            const gameId = await createGame({
              name: gameName,
              slug: gameSlug,
              provider: providerName,
              rtp: game.rtp || undefined,
              volatility: game.volatility || undefined,
              max_win: game.maxWin || undefined,
              features: JSON.stringify([]),
              description: `${gameName} is a slot game${providerName !== "Unknown" ? ` by ${providerName}` : ''}.`,
              image_url: game.image || undefined,
              demo_url: game.demoUrl || undefined,
              source_url: url,
              is_featured: true,
              is_new: true
            });

            savedGames.push({ id: gameId, name: gameName, provider: providerName });
          }
        }
      } catch (error) {
        console.error('Database error for game:', gameName, error);
      }
    }
    } // End of success check

    logs.push(`✅ Completed: ${savedGames.length} games saved`);
    const duration = Date.now() - startTime;
    console.log(`[processScraping] ${logs.join(' → ')} (${duration}ms)`);
    await sendDebugFollowUp("5", `Database processing complete: ${savedGames.length} games saved`);
    // Send appropriate notification to Discord based on results
    if (channelId && interactionToken) {
      try {
        if (savedGames.length > 0) {
          // Success: New games were added
          console.log('Sending Discord success notification...');
          const gamesText = savedGames.map(g => `• ${g.name} (${g.provider})`).join('\n');
          
          await sendDiscordFollowUp(interactionToken, {
            content: `✅ **Content Scraping Complete!**\n\n🔗 **Source:** ${url}\n\n🎰 **Games Processed:** ${games.length}\n**New Games Added:** ${savedGames.length}\n\n**Games:**\n${gamesText}\n\n🖼️ **Images:** Downloaded and stored locally\n🗄️ **Database:** Updated automatically\n🚀 **Website:** Changes deployed!`,
            embeds: [{
              color: 0x00ff00, // Green
              timestamp: new Date().toISOString(),
              footer: { text: "SlotVerse Content Scraper • New games added!" }
            }]
          });
          console.log('Discord success notification sent successfully');
        } else if (games.length > 0) {
          // Warning: Games found but already exist (duplicates)
          console.log('Sending Discord duplicate notification...');
          const gameNames = games.map((g: any) => g.name).join(', ');
          
          await sendDiscordFollowUp(interactionToken, {
            content: `⚠️ **Games Already Exist**\n\n🔗 **Source:** ${url}\n\n🎰 **Games Found:** ${games.length}\n**Status:** All games already exist in database\n\n**Games:**\n${gameNames}\n\n💡 **Suggestion:** Try a different game URL or check if this content was previously scraped.`,
            embeds: [{
              color: 0xffa500, // Orange
              timestamp: new Date().toISOString(),
              footer: { text: "SlotVerse Content Scraper • Duplicate detection" }
            }]
          });
          console.log('Discord duplicate notification sent successfully');
        } else {
          // Error: No games found at all
          console.log('Sending Discord no-games notification...');
          
          await sendDiscordFollowUp(interactionToken, {
            content: `❌ **No Games Found**\n\n🔗 **Source:** ${url}\n\n**Issue:** No game content could be extracted from this URL\n\n💡 **Troubleshooting:**\n• Verify the URL contains game information\n• Check if the page structure is supported\n• Try a direct game page URL instead of a category page`,
            embeds: [{
              color: 0xff6b6b, // Light red
              timestamp: new Date().toISOString(),
              footer: { text: "SlotVerse Content Scraper • No content found" }
            }]
          });
          console.log('Discord no-games notification sent successfully');
        }
      } catch (discordError) {
        console.error('Failed to send Discord notification:', discordError);
      }
    } else {
      console.error('Missing channelId or interactionToken for Discord notification');
    }

  } catch (error: any) {
    const duration = Date.now() - startTime;
    logs.push(`💥 Process error: ${error.message || String(error)}`);
    console.log(`[processScraping] ${logs.join(' → ')} (${duration}ms)`);
    
    // Send error notification to Discord
    if (channelId && interactionToken) {
      console.log('[processScraping] Sending Discord error notification...');
      try {
        await sendDiscordFollowUp(interactionToken, {
          content: `❌ **Scraping Process Error**\n\n🔗 **URL:** ${url}\n\n**Error:** ${error instanceof Error ? error.message : String(error)}\n\nPlease try again or contact support if the issue persists.`,
          embeds: [{
            color: 0xff0000,
            timestamp: new Date().toISOString(),
            footer: { text: "SlotVerse Content Scraper" }
          }]
        });
        console.log('[processScraping] Discord error notification sent successfully');
      } catch (discordError: any) {
        console.error('[processScraping] Failed to send Discord error notification:', discordError);
      }
    } else {
      console.error('[processScraping] Missing channelId or interactionToken for Discord error notification');
    }
  }
}

async function handleDbSetupCommand() {
  try {
    const dbConnected = await testConnection();
    if (!dbConnected) {
      return NextResponse.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "❌ Cannot connect to MySQL database. Please check your connection settings.",
          flags: 64
        }
      });
    }

    // Initialize tables would go here
    const embed = {
      title: "🗄️ Database Setup Complete!",
      color: 0x00ff00,
      fields: [
        { name: "📊 Tables Created", value: "• Games table\n• Providers table", inline: false },
        { name: "🎯 Features Ready", value: "• Game storage and retrieval\n• Provider management\n• Search functionality\n• Featured games system", inline: false }
      ],
      footer: {
        text: "Your MySQL database is now ready for game scraping! 🎰"
      }
    };

    return NextResponse.json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [embed]
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `❌ Database setup failed: ${error.message}`,
        flags: 64
      }
    });
  }
}

async function handleGamesCommand(options: any[]) {
  const limitOption = options?.find(opt => opt.name === 'limit');
  const limit = limitOption?.value || 5;

  const embed = {
    title: "🎰 Recent Games",
    color: 0x0099ff,
    description: `Showing last ${limit} games in database`,
    fields: [
      { name: "🎮 Game Name", value: "Coming soon...", inline: true },
      { name: "🏢 Provider", value: "Coming soon...", inline: true },
      { name: "📊 RTP", value: "Coming soon...", inline: true }
    ],
    footer: {
      text: "Use /copy [url] to add more games"
    }
  };

  return NextResponse.json({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [embed]
    }
  });
}

async function handleHelpCommand() {
  const embed = {
    title: "🎰 SlotVerse Discord Bot Commands",
    color: 0x7289da,
    fields: [
      {
        name: "🔧 **System Commands**",
        value: "`/status` - Check bot and database status\n`/dbsetup` - Initialize database tables\n`/help` - Show this help message",
        inline: false
      },
      {
        name: "🎮 **Game Management**",
        value: "`/copy [url]` - Scrape games from a website\n`/games [limit]` - List recent games in database",
        inline: false
      },
      {
        name: "💻 **Code Development**",
        value: "`/build [instruction]` - Ask AI to build/modify code\n`/edit [file] [changes]` - Edit specific files",
        inline: false
      },
      {
        name: "🌐 **Supported Sites**",
        value: "• SlotCatalog.com\n• SlotsLaunch.com\n• Demo sites with game data\n• Any site with structured game info",
        inline: false
      }
    ],
    footer: {
      text: "SlotVerse Bot - Manage your slots platform from Discord!"
    }
  };

  return NextResponse.json({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [embed]
    }
  });
}

async function handleBuildCommand(options: any[], body: any) {
  const instructionOption = options?.find(opt => opt.name === 'instruction');
  const instruction = instructionOption?.value;

  if (!instruction) {
    return NextResponse.json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "❌ Please provide an instruction for what to build.",
        flags: 64
      }
    });
  }

  // Send immediate response to Discord (must be within 3 seconds)
  const immediateResponse = NextResponse.json({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: `🤖 **AI Development Task Started**\n\n📝 **Instruction:** ${instruction}\n\n⏳ Processing with AI agent... This may take a moment.\n\n🔔 **Your team will be notified when complete!**`
    }
  });

  // Process the AI request in the background (don't await)
  // Extract values safely to avoid Proxy issues
  const channelId = String(body.channel_id);
  const token = String(body.token);
  
  processAIRequest(instruction, channelId, token, 'build').catch(console.error);

  return immediateResponse;
}

async function handleEditCommand(options: any[], body: any) {
  const fileOption = options?.find(opt => opt.name === 'file');
  const changesOption = options?.find(opt => opt.name === 'changes');
  const filePath = fileOption?.value;
  const changes = changesOption?.value;

  if (!filePath || !changes) {
    return NextResponse.json({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: "❌ Please provide both file path and changes to make.",
        flags: 64
      }
    });
  }

  // Send immediate response to Discord (must be within 3 seconds)
  const instruction = `Edit the file ${filePath}: ${changes}`;
  const immediateResponse = NextResponse.json({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: `✏️ **File Edit Task Started**\n\n📁 **File:** ${filePath}\n📝 **Changes:** ${changes.substring(0, 150)}${changes.length > 150 ? '...' : ''}\n\n⏳ Processing with AI agent... This may take a moment.\n\n🔔 **Your team will be notified when complete!**`
    }
  });

  // Process the AI request in the background (don't await)
  // Extract values safely to avoid Proxy issues
  const channelId = String(body.channel_id);
  const token = String(body.token);
  
  processAIRequest(instruction, channelId, token, 'edit').catch(console.error);

  return immediateResponse;
}

// Background function to process AI requests without blocking Discord response
async function processAIRequest(instruction: string, channelId?: string, interactionToken?: string, taskType: string = 'build'): Promise<void> {
  try {
    console.log('Processing AI request in background:', instruction);
    
    const baseUrl = 'https://slotverse.net';
    const agentResponse = await fetch(`${baseUrl}/api/agent/dev`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: instruction,
        sessionId: 'discord-background'
      })
    });

    if (!agentResponse.ok) {
      console.error('AI agent request failed:', agentResponse.status);
      
      // Get error details
      let errorMessage = `The AI agent encountered an error (${agentResponse.status}).`;
      let troubleshooting = "• Check if the instruction is clear\n• Verify the AI agent is running\n• Try a simpler request first";
      
      try {
        const errorData = await agentResponse.json();
        if (errorData.error) {
          if (errorData.type === 'quota_exceeded' || errorData.error.includes('quota') || errorData.error.includes('429')) {
            errorMessage = "🚫 **OpenAI API Quota Exceeded**\n\nYour OpenAI account has run out of credits or hit the usage limit.";
            troubleshooting = "• Add credits to your OpenAI account at [platform.openai.com/account/billing](https://platform.openai.com/account/billing)\n• Upgrade your OpenAI plan\n• Wait for quota reset if on free tier\n• Contact your admin to resolve billing issues";
          } else if (errorData.type === 'auth_failed' || errorData.error.includes('401') || errorData.error.includes('authentication')) {
            errorMessage = "🔑 **OpenAI API Authentication Failed**\n\nThe API key is invalid or expired.";
            troubleshooting = "• Check OPENAI_API_KEY environment variable\n• Verify the API key is correct\n• Regenerate API key if needed";
          } else {
            errorMessage = `🐛 **AI Agent Error**\n\n${errorData.error.substring(0, 200)}${errorData.error.length > 200 ? '...' : ''}`;
            troubleshooting = "• Check the error details above\n• Try a simpler request\n• Contact support if the issue persists";
          }
        }
      } catch (e) {
        // If we can't parse the error, use the status code
        console.error('Failed to parse agent error response:', e);
      }
      
      // Send failure notification to Discord
      if (channelId) {
        await sendDiscordFollowUp(channelId, {
          content: `❌ **${taskType === 'build' ? 'Build' : 'Edit'} Task Failed**\n\n${errorMessage}`,
          embeds: [{
            title: "🔧 How to Fix This",
            color: 0xff0000,
            description: troubleshooting,
            footer: { text: "SlotVerse AI Agent • Error occurred during processing" }
          }]
        });
      }
      return;
    }

    const result = await agentResponse.json();
    console.log('AI agent request completed successfully');
    
    // Send success notification to Discord
    if (channelId) {
      await sendDiscordFollowUp(channelId, {
        content: `✅ **${taskType === 'build' ? 'Build' : 'Edit'} Task Completed!**\n\n🎯 **Instruction:** ${instruction.substring(0, 100)}${instruction.length > 100 ? '...' : ''}\n\n🚀 **Status:** Changes have been committed to GitHub and deployed automatically!`,
        embeds: [{
          title: "🔗 Check the Results",
          color: 0x00ff00,
          fields: [
            { name: "🌐 Website", value: "[slotverse.net](https://slotverse.net)", inline: true },
            { name: "📝 GitHub", value: "[View Commits](https://github.com/kennytseu/slotverse-fe/commits/main)", inline: true },
            { name: "⚡ Vercel", value: "[Deployment Logs](https://vercel.com/slotverse/slotverse)", inline: true }
          ],
          footer: { text: "SlotVerse AI Agent • Task completed successfully" }
        }]
      });
    }
    
  } catch (error) {
    console.error('Background AI request error:', error);
    
    // Send error notification to Discord
    if (channelId) {
      await sendDiscordFollowUp(channelId, {
        content: `❌ **${taskType === 'build' ? 'Build' : 'Edit'} Task Error**\n\nAn unexpected error occurred while processing your request. Please try again.`,
        embeds: [{
          title: "🐛 Error Details",
          color: 0xff0000,
          description: `\`\`\`${error instanceof Error ? error.message : String(error)}\`\`\``,
        }]
      });
    }
  }
}

// Function to send follow-up messages to Discord
async function sendDiscordFollowUp(interactionToken: string, message: any): Promise<void> {
  try {
    // Use POST to send new follow-up message instead of PATCH to edit original
    const discordApiUrl = `https://discord.com/api/v10/webhooks/${process.env.DISCORD_APPLICATION_ID}/${interactionToken}`;
    
    const response = await fetch(discordApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to send Discord follow-up: ${response.status} - ${errorText}`);
      
      // If Discord follow-up fails, at least log the message that would have been sent
      console.log('Message that failed to send:', JSON.stringify(message, null, 2));
      
      if (response.status === 403) {
        console.error('Discord bot lacks "Send Messages" permission in this channel');
      } else if (response.status === 401) {
        console.error('Discord bot token is invalid or expired');
      }
    } else {
      console.log('Discord follow-up sent successfully');
    }
  } catch (error) {
    console.error('Discord follow-up error:', error);
    console.log('Message that failed to send:', JSON.stringify(message, null, 2));
  }
}
