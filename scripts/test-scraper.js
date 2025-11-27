#!/usr/bin/env node

/**
 * Test script for the robust scraper
 * Usage: node scripts/test-scraper.js [URL]
 */

const { robustScraper } = require('../lib/utils/robust-scraper.ts');

async function testScraper() {
  const testUrl = process.argv[2] || 'https://www.pragmaticplay.com/games/gates-of-olympus/';
  
  console.log('🧪 Testing Robust Scraper');
  console.log('========================');
  console.log(`URL: ${testUrl}`);
  console.log('');

  try {
    const startTime = Date.now();
    const result = await robustScraper.scrapeUrl(testUrl);
    const duration = Date.now() - startTime;

    console.log(`⏱️  Total time: ${duration}ms`);
    console.log('');

    if (result.success) {
      console.log('✅ SUCCESS!');
      console.log(`Strategy: ${result.data.metadata.strategy}`);
      console.log(`Games found: ${result.data.games.length}`);
      console.log(`Providers: ${result.data.providers.length}`);
      console.log('');
      
      result.data.games.forEach((game, i) => {
        console.log(`Game ${i + 1}:`);
        console.log(`  Name: ${game.name}`);
        console.log(`  Provider: ${game.provider || 'N/A'}`);
        console.log(`  RTP: ${game.rtp || 'N/A'}`);
        console.log(`  Source: ${game.source}`);
        console.log('');
      });
    } else {
      console.log('❌ FAILED');
      console.log(`Error: ${result.error}`);
    }
  } catch (error) {
    console.error('💥 CRASH:', error.message);
    process.exit(1);
  }
}

testScraper();
