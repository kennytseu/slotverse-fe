#!/usr/bin/env node

/**
 * Test Discord follow-up message using bot token (like after /copy command)
 */

require('dotenv').config({ path: '.env.local' });

async function testDiscordFollowUp() {
  const interactionToken = process.argv[2];
  
  if (!interactionToken) {
    console.log('❌ Please provide an interaction token');
    console.log('Usage: node test-discord-followup.js <INTERACTION_TOKEN>');
    console.log('');
    console.log('To get an interaction token:');
    console.log('1. Use a real /copy command in Discord');
    console.log('2. Check the logs for the interaction token');
    console.log('3. Use that token within 15 minutes');
    console.log('');
    console.log('Or use the webhook test instead: node test-discord-webhook.js <WEBHOOK_URL>');
    process.exit(1);
  }

  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) {
    console.log('❌ DISCORD_BOT_TOKEN not found in .env.local');
    process.exit(1);
  }

  console.log('🤖 Testing Discord Follow-up from Localhost');
  console.log('============================================');
  console.log(`Bot Token: ${botToken.substring(0, 20)}...`);
  console.log(`Interaction Token: ${interactionToken.substring(0, 20)}...`);
  console.log('');

  const followUpMessage = {
    content: "🧪 **Test Follow-up from Localhost!**",
    embeds: [{
      title: "SlotVerse Scraper Test Results",
      description: "This follow-up message was sent from your local development server!",
      color: 0x0099ff, // Blue
      fields: [
        {
          name: "🎰 Test Game",
          value: "Gates of Olympus",
          inline: true
        },
        {
          name: "🏢 Provider", 
          value: "Pragmatic Play",
          inline: true
        },
        {
          name: "📊 RTP",
          value: "96.50%",
          inline: true
        },
        {
          name: "✅ Scraping Status",
          value: "Successfully extracted game data using DirectFetch strategy in 2.1 seconds",
          inline: false
        }
      ],
      footer: {
        text: "SlotVerse Content Scraper • Local Test",
      },
      timestamp: new Date().toISOString()
    }]
  };

  try {
    const startTime = Date.now();
    
    const url = `https://discord.com/api/v10/webhooks/${process.env.DISCORD_APPLICATION_ID}/${interactionToken}/messages/@original`;
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bot ${botToken}`
      },
      body: JSON.stringify(followUpMessage)
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️  Response time: ${duration}ms`);
    console.log(`📡 Status: ${response.status} ${response.statusText}`);
    console.log('');

    if (response.ok) {
      console.log('✅ SUCCESS! Follow-up message sent to Discord!');
      console.log('Check your Discord channel to see the updated message.');
    } else {
      console.log('❌ FAILED to send follow-up');
      const errorText = await response.text();
      console.log(`Error: ${errorText}`);
      
      if (response.status === 401) {
        console.log('💡 This might be because:');
        console.log('   • Bot token is invalid');
        console.log('   • Interaction token expired (15 min limit)');
      }
    }

  } catch (error) {
    console.error('💥 CRASH:', error.message);
    process.exit(1);
  }
}

testDiscordFollowUp();
