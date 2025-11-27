#!/usr/bin/env node

/**
 * Test sending a Discord webhook message from localhost
 */

async function testDiscordWebhook() {
  // You'll need to provide your Discord webhook URL
  const webhookUrl = process.argv[2];
  
  if (!webhookUrl) {
    console.log('❌ Please provide a Discord webhook URL');
    console.log('Usage: node test-discord-webhook.js <WEBHOOK_URL>');
    console.log('');
    console.log('To get a webhook URL:');
    console.log('1. Go to your Discord server settings');
    console.log('2. Click "Integrations" → "Webhooks"');
    console.log('3. Create a new webhook or copy existing one');
    console.log('4. Copy the webhook URL');
    process.exit(1);
  }

  console.log('🤖 Testing Discord Webhook from Localhost');
  console.log('==========================================');
  console.log(`Webhook URL: ${webhookUrl.substring(0, 50)}...`);
  console.log('');

  const testMessage = {
    content: "🧪 **Test Message from Localhost!**",
    embeds: [{
      title: "SlotVerse Robust Scraper",
      description: "This message was sent from your local development server to test Discord integration!",
      color: 0x00ff00, // Green
      fields: [
        {
          name: "🚀 Status",
          value: "Local testing successful!",
          inline: true
        },
        {
          name: "⏰ Time",
          value: new Date().toLocaleString(),
          inline: true
        },
        {
          name: "🔧 Features Tested",
          value: "• Robust scraper with 5 strategies\n• Discord webhook integration\n• Local development environment",
          inline: false
        }
      ],
      footer: {
        text: "SlotVerse Development Server",
        icon_url: "https://cdn.discordapp.com/embed/avatars/0.png"
      },
      timestamp: new Date().toISOString()
    }]
  };

  try {
    const startTime = Date.now();
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage)
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️  Response time: ${duration}ms`);
    console.log(`📡 Status: ${response.status} ${response.statusText}`);
    console.log('');

    if (response.ok) {
      console.log('✅ SUCCESS! Message sent to Discord!');
      console.log('Check your Discord channel to see the test message.');
    } else {
      console.log('❌ FAILED to send message');
      const errorText = await response.text();
      console.log(`Error: ${errorText}`);
    }

  } catch (error) {
    console.error('💥 CRASH:', error.message);
    process.exit(1);
  }
}

testDiscordWebhook();
