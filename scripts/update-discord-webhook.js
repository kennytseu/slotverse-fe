// Using built-in fetch (Node.js 18+)
require('dotenv').config({ path: '.env.local' });

async function updateDiscordWebhookUrl() {
  const applicationId = process.env.DISCORD_APPLICATION_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const newWebhookUrl = 'https://slotverse.net/api/discord';

  if (!applicationId || !botToken) {
    console.error('❌ Missing DISCORD_APPLICATION_ID or DISCORD_BOT_TOKEN in environment variables');
    process.exit(1);
  }

  try {
    console.log('🔧 Updating Discord webhook URL...');
    console.log(`📍 Application ID: ${applicationId}`);
    console.log(`🔗 New Webhook URL: ${newWebhookUrl}`);

    // Update the application's interactions endpoint URL
    const response = await fetch(`https://discord.com/api/v10/applications/${applicationId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        interactions_endpoint_url: newWebhookUrl
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`❌ Failed to update webhook URL: ${response.status} ${response.statusText}`);
      console.error('Error details:', errorData);
      process.exit(1);
    }

    const data = await response.json();
    console.log('✅ Successfully updated Discord webhook URL!');
    console.log(`📋 Current interactions endpoint: ${data.interactions_endpoint_url}`);
    
    console.log('\n🎯 Next steps:');
    console.log('1. Test the /copy command in Discord');
    console.log('2. Watch terminal output for debug messages');
    console.log('3. Verify if all steps (1, 2, 3, 4, 5) appear');
    console.log('\n🔍 This will prove if Vercel was censoring our debug messages!');

  } catch (error) {
    console.error('❌ Error updating Discord webhook URL:', error.message);
    process.exit(1);
  }
}

// Check required environment variables
if (!process.env.DISCORD_APPLICATION_ID) {
  console.error('❌ Missing DISCORD_APPLICATION_ID in environment variables');
  process.exit(1);
}

if (!process.env.DISCORD_BOT_TOKEN) {
  console.error('❌ Missing DISCORD_BOT_TOKEN in environment variables');
  process.exit(1);
}

console.log('🤖 Discord Webhook URL Updater');
console.log('===============================');
updateDiscordWebhookUrl();
