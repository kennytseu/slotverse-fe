#!/usr/bin/env node

/**
 * Test the scraper locally by calling the API endpoint
 */

async function testScraperLocal() {
  const testUrl = process.argv[2] || 'https://www.pragmaticplay.com/games/gates-of-olympus/';
  
  console.log('🧪 Testing Local Scraper API');
  console.log('============================');
  console.log(`URL: ${testUrl}`);
  console.log('Calling: http://localhost:3000/api/scrape');
  console.log('');

  try {
    const startTime = Date.now();
    
    const response = await fetch('http://localhost:3000/api/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: testUrl,
        extractType: 'auto'
      })
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️  API Response time: ${duration}ms`);
    console.log(`📡 Status: ${response.status} ${response.statusText}`);
    console.log('');

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ SUCCESS!');
      console.log(`Games saved: ${result.savedGames?.length || 0}`);
      console.log(`Providers saved: ${result.savedProviders?.length || 0}`);
      console.log(`Message: ${result.message}`);
      console.log('');
      
      if (result.savedGames?.length > 0) {
        result.savedGames.forEach((game, i) => {
          console.log(`Game ${i + 1}:`);
          console.log(`  Name: ${game.name}`);
          console.log(`  Provider: ${game.provider || 'N/A'}`);
          console.log(`  RTP: ${game.rtp || 'N/A'}`);
          console.log(`  Image: ${game.image || 'N/A'}`);
          console.log('');
        });
      }
    } else {
      console.log('❌ FAILED');
      console.log(`Error: ${result.error || 'Unknown error'}`);
      console.log('Full response:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('💥 CRASH:', error.message);
    process.exit(1);
  }
}

testScraperLocal();
