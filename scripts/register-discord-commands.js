const { REST, Routes } = require('discord.js');
require('dotenv').config({ path: '.env.local' });

const commands = [
  {
    name: 'status',
    description: 'Check SlotVerse bot and database status',
  },
  {
    name: 'copy',
    description: 'Scrape games from a website URL',
    options: [
      {
        name: 'url',
        description: 'The URL to scrape games from',
        type: 3, // STRING
        required: true,
      },
    ],
  },
  {
    name: 'dbsetup',
    description: 'Initialize database tables for SlotVerse',
  },
  {
    name: 'games',
    description: 'List recent games in the database',
    options: [
      {
        name: 'limit',
        description: 'Number of games to show (default: 5)',
        type: 4, // INTEGER
        required: false,
      },
    ],
  },
  {
    name: 'help',
    description: 'Show available SlotVerse bot commands',
  },
  {
    name: 'build',
    description: 'Ask AI to build/modify code for SlotVerse',
    options: [
      {
        name: 'instruction',
        description: 'What do you want to build or modify?',
        type: 3, // STRING
        required: true,
      },
    ],
  },
  {
    name: 'edit',
    description: 'Edit a specific file in the codebase',
    options: [
      {
        name: 'file',
        description: 'File path to edit (e.g., components/Header.tsx)',
        type: 3, // STRING
        required: true,
      },
      {
        name: 'changes',
        description: 'What changes to make to the file',
        type: 3, // STRING
        required: true,
      },
    ],
  },
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

async function registerCommands() {
  try {
    console.log('🤖 Registering Discord slash commands...');

    // Register commands globally (takes up to 1 hour to propagate)
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_APPLICATION_ID),
      { body: commands },
    );

    console.log('✅ Successfully registered Discord commands!');
    console.log('📋 Registered commands:');
    commands.forEach(cmd => {
      console.log(`   /${cmd.name} - ${cmd.description}`);
    });
    
    console.log('\n🔗 Next steps:');
    console.log('1. Add your bot to Discord servers with these permissions:');
    console.log('   - applications.commands');
    console.log('   - Send Messages');
    console.log('   - Use Slash Commands');
    console.log('2. Set your Discord webhook URL in Discord Developer Portal:');
    console.log(`   ${process.env.NODE_ENV === 'production' ? 'https://slotverse.net' : 'http://localhost:3000'}/api/discord`);
    console.log('3. Test with /status command in your Discord server');

  } catch (error) {
    console.error('❌ Error registering Discord commands:', error);
    
    if (error.code === 50001) {
      console.log('💡 Missing Access: Make sure your bot has the applications.commands scope');
    } else if (error.code === 401) {
      console.log('💡 Invalid Token: Check your DISCORD_BOT_TOKEN in .env.local');
    }
  }
}

// Check required environment variables
if (!process.env.DISCORD_BOT_TOKEN) {
  console.error('❌ Missing DISCORD_BOT_TOKEN in environment variables');
  console.log('💡 Add DISCORD_BOT_TOKEN to your .env.local file');
  process.exit(1);
}

if (!process.env.DISCORD_APPLICATION_ID) {
  console.error('❌ Missing DISCORD_APPLICATION_ID in environment variables');
  console.log('💡 Add DISCORD_APPLICATION_ID to your .env.local file');
  process.exit(1);
}

// Check authorization setup
const hasServerAuth = process.env.ALLOWED_DISCORD_SERVERS;
const hasUserAuth = process.env.ALLOWED_DISCORD_USERS;

if (!hasServerAuth && !hasUserAuth) {
  console.warn('⚠️  No authorization configured');
  console.log('💡 Add ALLOWED_DISCORD_SERVERS (recommended) or ALLOWED_DISCORD_USERS');
  console.log('   Without this, anyone can use your bot commands!');
}

registerCommands();
