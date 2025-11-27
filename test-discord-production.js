#!/usr/bin/env node

/**
 * Test Discord notification system using production environment
 */

require('dotenv').config({ path: '.env.local' });

async function testDiscordProduction() {
  console.log('🧪 Testing Discord Production Notification System');
  console.log('=================================================');
  
  const applicationId = process.env.DISCORD_APPLICATION_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;
  
  console.log(`Application ID: ${applicationId ? 'SET' : 'MISSING'}`);
  console.log(`Bot Token: ${botToken ? 'SET' : 'MISSING'}`);
  console.log('');

  if (!applicationId || !botToken) {
    console.log('❌ Missing required environment variables');
    return;
  }

  // Test the sendDiscordFollowUp function with a mock token
  const mockInteractionToken = 'test_token_' + Date.now();
  
  const testMessage = {
    content: "🧪 **Test Message from Production Code**\n\nThis is testing the Discord notification system to verify it's working correctly.",
    embeds: [{
      title: "Discord System Test",
      color: 0x0099ff,
      fields: [
        {
          name: "Status",
          value: "Testing notification system",
          inline: true
        },
        {
          name: "Time",
          value: new Date().toLocaleString(),
          inline: true
        }
      ],
      footer: {
        text: "SlotVerse Test System"
      },
      timestamp: new Date().toISOString()
    }]
  };

  try {
    console.log('📤 Attempting to send Discord notification...');
    
    const discordApiUrl = `https://discord.com/api/v10/webhooks/${applicationId}/${mockInteractionToken}/messages/@original`;
    
    console.log(`URL: ${discordApiUrl.substring(0, 60)}...`);
    
    const response = await fetch(discordApiUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage)
    });

    console.log(`📡 Response: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Error: ${errorText}`);
    } else {
      console.log('✅ Discord API call successful (though token is mock)');
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
  
  console.log('');
  console.log('💡 This test shows if the Discord API setup is correct.');
  console.log('   Real tokens would be needed for actual message delivery.');
}

testDiscordProduction();
