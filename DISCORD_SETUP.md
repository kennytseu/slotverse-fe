# 🤖 SlotVerse Discord Bot Setup Guide

This guide will help you set up the SlotVerse Discord bot so you and your team can manage your slots platform directly from Discord!

## 🚀 Quick Start

### Step 1: Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Name it "SlotVerse Bot"
4. Go to "Bot" section
5. Click "Add Bot"
6. Copy the **Bot Token** (keep it secret!)
7. Copy the **Application ID** from "General Information"

### Step 2: Add Environment Variables

Add these to your `.env.local` file:

```env
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_APPLICATION_ID=your_application_id_here
ALLOWED_DISCORD_USERS=user_id_1,user_id_2,user_id_3
```

**To get your Discord User ID:**
1. Enable Developer Mode in Discord (User Settings > Advanced > Developer Mode)
2. Right-click your username and select "Copy User ID"

### Step 3: Register Bot Commands

```bash
cd /Users/kennytseu/slotverse-fe
node scripts/register-discord-commands.js
```

### Step 4: Set Webhook URL

1. Go back to Discord Developer Portal
2. Go to "General Information"
3. Set **Interactions Endpoint URL** to:
   - **Production**: `https://slotverse.net/api/discord`
   - **Development**: `http://localhost:3000/api/discord`

### Step 5: Invite Bot to Server

Generate invite link with these permissions:
- `applications.commands` (Use Slash Commands)
- `bot` (Bot permissions)
- `Send Messages`
- `Use Slash Commands`

**Invite URL Format:**
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_APPLICATION_ID&permissions=2147483648&scope=bot%20applications.commands
```

## 🎮 Available Commands

### 🔧 System Commands
- `/status` - Check bot and database status
- `/dbsetup` - Initialize database tables
- `/help` - Show available commands

### 🎰 Game Management
- `/copy [url]` - Scrape games from a website
- `/games [limit]` - List recent games in database

### 🌐 Supported Websites
- SlotCatalog.com
- SlotsLaunch.com
- Demo sites with game data
- Any site with structured game information

## 📋 Example Usage

```
/status
# Shows: Bot online, database connected, ready to scrape

/copy https://demo.slotslaunch.com/mercury/slots/gates-of-olympus-1000/
# Scrapes: Game info, images, demo URLs, saves to database

/games 10
# Shows: Last 10 games added to database

/dbsetup
# Creates: MySQL tables for games and providers
```

## 🛠️ Development Setup

### Local Testing

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Use ngrok for webhook testing:**
   ```bash
   npx ngrok http 3000
   ```

3. **Update Discord webhook URL** to ngrok URL:
   ```
   https://your-ngrok-url.ngrok.io/api/discord
   ```

### Production Deployment

1. **Add environment variables to Vercel:**
   ```bash
   vercel env add DISCORD_BOT_TOKEN
   vercel env add DISCORD_APPLICATION_ID
   vercel env add ALLOWED_DISCORD_USERS
   ```

2. **Deploy to production:**
   ```bash
   vercel --prod
   ```

3. **Update Discord webhook URL** to production:
   ```
   https://slotverse.net/api/discord
   ```

## 🔒 Security Features

- **User Authorization**: Only allowed Discord users can use commands
- **Webhook Verification**: Discord signature verification (production)
- **Environment Variables**: Secure token storage
- **Error Handling**: Graceful error responses

## 🎯 Team Collaboration

### Adding Team Members

1. **Get their Discord User ID** (Developer Mode > Right-click > Copy User ID)
2. **Add to environment variable:**
   ```env
   ALLOWED_DISCORD_USERS=123456789,987654321,555666777
   ```
3. **Redeploy** the application

### Team Workflow

1. **Content Manager**: Uses `/copy` to add new games
2. **Developer**: Uses `/status` to monitor system health
3. **Admin**: Uses `/dbsetup` to manage database
4. **Team**: Uses `/games` to see recent additions

## 🚨 Troubleshooting

### Bot Not Responding
- Check webhook URL is correct
- Verify bot token in environment variables
- Ensure bot has proper permissions in Discord server

### Commands Not Showing
- Re-run `node scripts/register-discord-commands.js`
- Wait up to 1 hour for global commands to propagate
- Check Application ID is correct

### Database Errors
- Verify MySQL connection with `/status`
- Run `/dbsetup` to initialize tables
- Check MySQL environment variables

### Permission Denied
- Add your Discord User ID to `ALLOWED_DISCORD_USERS`
- Redeploy the application
- Check user ID format (numbers only, no spaces)

## 📞 Support

If you need help setting up the Discord bot:

1. **Check logs** in Vercel dashboard
2. **Test locally** with ngrok
3. **Verify environment variables** are set correctly
4. **Ensure MySQL database** is accessible

---

🎰 **Happy Gaming!** Your team can now manage SlotVerse directly from Discord! 🚀
