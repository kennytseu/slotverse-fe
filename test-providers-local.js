// Using built-in fetch (Node.js 18+)

async function testProvidersCommand() {
  console.log('🧪 Testing /providers command locally...\n');
  
  const mockDiscordInteraction = {
    type: 2, // APPLICATION_COMMAND
    data: {
      name: 'providers',
      options: [
        {
          name: 'url',
          value: 'https://slotslaunch.com/providers'
        },
        {
          name: 'pages',
          value: 2
        }
      ]
    },
    channel_id: '1234567890',
    token: 'mock_interaction_token_for_testing_providers_command_12345',
    guild_id: '1234567890'
  };

  try {
    console.log('📤 Sending mock /providers interaction to localhost...');
    console.log('🔗 URL:', mockDiscordInteraction.data.options[0].value);
    console.log('📄 Pages:', mockDiscordInteraction.data.options[1].value);
    
    const response = await fetch('http://localhost:3000/api/discord', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature-Ed25519': 'mock_signature',
        'X-Signature-Timestamp': Date.now().toString()
      },
      body: JSON.stringify(mockDiscordInteraction)
    });

    console.log('\n📥 Response Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Response Data:', JSON.stringify(data, null, 2));
      
      if (data.data && data.data.content) {
        console.log('\n💬 Discord Message:');
        console.log(data.data.content);
      }
      
      console.log('\n🔍 Expected behavior:');
      console.log('1. ✅ Immediate response with "Provider Scraping Started" message');
      console.log('2. 🔄 Background processing should start');
      console.log('3. 📊 Should scrape providers from slotslaunch.com/providers');
      console.log('4. 🏢 Should find multiple providers (583 total across 12 pages)');
      console.log('5. 💾 Should process and log provider data');
      console.log('\n⏳ Check server logs for background processing...');
      
    } else {
      const errorText = await response.text();
      console.error('❌ Error Response:', errorText);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure localhost server is running:');
    console.log('   npm run dev');
  }
}

console.log('🎯 SlotVerse Providers Command Test');
console.log('=====================================');
testProvidersCommand();
