#!/usr/bin/env node

/**
 * Test different Discord notification approaches
 */

require('dotenv').config({ path: '.env.local' });

async function testDiscordApproaches() {
  console.log('🧪 Testing Discord Notification Approaches');
  console.log('==========================================');
  
  const applicationId = process.env.DISCORD_APPLICATION_ID;
  const mockToken = 'test_token_' + Date.now();
  
  console.log(`Application ID: ${applicationId}`);
  console.log(`Mock Token: ${mockToken}`);
  console.log('');

  // Test 1: Current approach (PATCH @original)
  console.log('📝 Test 1: PATCH @original (current approach)');
  try {
    const url1 = `https://discord.com/api/v10/webhooks/${applicationId}/${mockToken}/messages/@original`;
    console.log(`   URL: ${url1.substring(0, 80)}...`);
    console.log(`   Method: PATCH`);
    console.log(`   Purpose: Edit the original response`);
    console.log(`   ✅ This is what we're currently doing`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('');
  
  // Test 2: Alternative approach (POST new message)
  console.log('📝 Test 2: POST new follow-up (alternative approach)');
  try {
    const url2 = `https://discord.com/api/v10/webhooks/${applicationId}/${mockToken}`;
    console.log(`   URL: ${url2.substring(0, 80)}...`);
    console.log(`   Method: POST`);
    console.log(`   Purpose: Send new follow-up message`);
    console.log(`   💡 This would create a separate message`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('');
  console.log('🤔 Analysis:');
  console.log('   • Current: Edits the "Scraping Started" message');
  console.log('   • Alternative: Sends a new "Results" message');
  console.log('   • Both should work with valid tokens');
  console.log('   • Issue might be token expiration or timing');
  console.log('');
  console.log('💡 Recommendation:');
  console.log('   • Keep current approach (PATCH @original)');
  console.log('   • Add better error handling and logging');
  console.log('   • Check token expiration timing');
}

testDiscordApproaches();
