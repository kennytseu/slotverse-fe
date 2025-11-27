#!/usr/bin/env node

/**
 * Test Discord /copy command locally
 */

async function testDiscordLocal() {
  const testUrl = process.argv[2] || 'https://www.pragmaticplay.com/games/sweet-bonanza/';
  
  console.log('🤖 Testing Local Discord API');
  console.log('=============================');
  console.log(`URL: ${testUrl}`);
  console.log('Calling: http://localhost:3000/api/discord');
  console.log('');

  // Mock Discord interaction payload
  const discordPayload = {
    type: 2, // APPLICATION_COMMAND
    data: {
      name: 'copy',
      options: [
        {
          name: 'url',
          value: testUrl
        }
      ]
    },
    guild_id: '867611617721450546', // Use the actual allowed server ID
    channel_id: '1234567890123456789',
    token: 'mock_interaction_token_for_testing',
    user: {
      id: '987654321098765432',
      username: 'testuser'
    }
  };

  try {
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:3000/api/discord', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature-Ed25519': 'mock_signature',
        'X-Signature-Timestamp': Math.floor(Date.now() / 1000).toString()
      },
      body: JSON.stringify(discordPayload)
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️  API Response time: ${duration}ms`);
    console.log(`📡 Status: ${response.status} ${response.statusText}`);
    console.log('');

    const result = await response.json();
    
    console.log('📋 Discord Response:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('💥 CRASH:', error.message);
    process.exit(1);
  }
}

testDiscordLocal();
