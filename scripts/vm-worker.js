#!/usr/bin/env node

/**
 * VM Background Worker for Processing Scraping Jobs
 * 
 * This script runs on your VM and continuously processes pending scraping jobs.
 * It polls the database for new jobs, processes them, and sends Discord notifications.
 */

const mysql = require('mysql2/promise');
const fetch = require('node-fetch');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'slotverse',
  ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
};

// Worker configuration
const WORKER_CONFIG = {
  pollInterval: 5000, // Check for new jobs every 5 seconds
  maxConcurrentJobs: 3, // Process up to 3 jobs simultaneously
  jobTimeout: 300000, // 5 minutes timeout per job
  retryAttempts: 3,
  retryDelay: 10000 // 10 seconds between retries
};

let connection;
let isRunning = false;
let activeJobs = new Set();

/**
 * Initialize database connection
 */
async function initDatabase() {
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

/**
 * Get pending scraping jobs from database
 */
async function getPendingJobs(limit = 5) {
  try {
    const [rows] = await connection.execute(
      `SELECT * FROM scraping_jobs 
       WHERE status = 'pending' 
       ORDER BY created_at ASC 
       LIMIT ?`,
      [limit]
    );
    return rows;
  } catch (error) {
    console.error('❌ Error fetching pending jobs:', error.message);
    return [];
  }
}

/**
 * Update job status in database
 */
async function updateJobStatus(jobId, status, errorMessage = null, resultData = null) {
  try {
    let query, params;
    
    if (status === 'processing') {
      query = `UPDATE scraping_jobs SET status = ?, started_at = NOW() WHERE id = ?`;
      params = [status, jobId];
    } else if (status === 'completed') {
      query = `UPDATE scraping_jobs SET status = ?, completed_at = NOW(), result_data = ? WHERE id = ?`;
      params = [status, JSON.stringify(resultData || {}), jobId];
    } else if (status === 'failed') {
      query = `UPDATE scraping_jobs SET status = ?, completed_at = NOW(), error_message = ? WHERE id = ?`;
      params = [status, errorMessage || 'Unknown error', jobId];
    }
    
    await connection.execute(query, params);
    console.log(`📝 Job ${jobId} status updated to: ${status}`);
    return true;
  } catch (error) {
    console.error(`❌ Error updating job ${jobId} status:`, error.message);
    return false;
  }
}

/**
 * Send Discord notification when job completes
 */
async function sendDiscordNotification(job, result) {
  if (!job.discord_interaction_token || !process.env.DISCORD_APPLICATION_ID) {
    console.log(`⚠️  Job ${job.id}: No Discord token available for notification`);
    return;
  }

  try {
    const webhookUrl = `https://discord.com/api/v10/webhooks/${process.env.DISCORD_APPLICATION_ID}/${job.discord_interaction_token}`;
    
    let message;
    if (result.success) {
      const gamesCount = result.games?.length || 0;
      const gamesText = result.games?.map(g => `• ${g.name} (${g.provider})`).join('\n') || 'No games found';
      
      message = {
        content: `✅ **Scraping Job #${job.id} Complete!**\n\n🔗 **Source:** ${job.url}\n🎰 **Games Found:** ${gamesCount}\n\n**Games:**\n${gamesText}\n\n🖼️ **Images:** Downloaded and stored\n🗄️ **Database:** Updated automatically`,
        embeds: [{
          color: 0x00ff00, // Green
          timestamp: new Date().toISOString(),
          footer: { text: "SlotVerse VM Worker • Processing complete" }
        }]
      };
    } else {
      message = {
        content: `❌ **Scraping Job #${job.id} Failed**\n\n🔗 **Source:** ${job.url}\n**Error:** ${result.error || 'Unknown error'}\n\n💡 **Next Steps:** The job will be retried automatically or you can try a different URL.`,
        embeds: [{
          color: 0xff0000, // Red
          timestamp: new Date().toISOString(),
          footer: { text: "SlotVerse VM Worker • Processing failed" }
        }]
      };
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });

    if (response.ok) {
      console.log(`✅ Discord notification sent for job ${job.id}`);
    } else {
      console.error(`❌ Discord notification failed for job ${job.id}:`, response.status);
    }
  } catch (error) {
    console.error(`❌ Error sending Discord notification for job ${job.id}:`, error.message);
  }
}

/**
 * Process a single scraping job
 */
async function processJob(job) {
  const jobId = job.id;
  console.log(`🚀 Processing job ${jobId}: ${job.url}`);
  
  try {
    // Mark job as processing
    await updateJobStatus(jobId, 'processing');
    activeJobs.add(jobId);

    // TODO: Replace this with your actual scraping logic
    // For now, simulate the scraping process
    const result = await simulateScrapingProcess(job.url);
    
    if (result.success) {
      await updateJobStatus(jobId, 'completed', null, result);
      await sendDiscordNotification(job, result);
      console.log(`✅ Job ${jobId} completed successfully`);
    } else {
      await updateJobStatus(jobId, 'failed', result.error);
      await sendDiscordNotification(job, result);
      console.log(`❌ Job ${jobId} failed: ${result.error}`);
    }

  } catch (error) {
    console.error(`❌ Error processing job ${jobId}:`, error.message);
    await updateJobStatus(jobId, 'failed', error.message);
    await sendDiscordNotification(job, { success: false, error: error.message });
  } finally {
    activeJobs.delete(jobId);
  }
}

/**
 * Simulate scraping process (replace with actual scraping logic)
 */
async function simulateScrapingProcess(url) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // TODO: Replace this with actual scraping logic
  // You can call your robust scraper here
  
  // Simulate success/failure
  if (Math.random() > 0.2) { // 80% success rate for simulation
    return {
      success: true,
      games: [
        { name: 'Sample Game 1', provider: 'Sample Provider' },
        { name: 'Sample Game 2', provider: 'Sample Provider' }
      ]
    };
  } else {
    return {
      success: false,
      error: 'Simulated scraping failure'
    };
  }
}

/**
 * Main worker loop
 */
async function workerLoop() {
  if (!isRunning) return;

  try {
    // Check if we can process more jobs
    if (activeJobs.size >= WORKER_CONFIG.maxConcurrentJobs) {
      console.log(`⏳ Max concurrent jobs (${WORKER_CONFIG.maxConcurrentJobs}) reached, waiting...`);
      return;
    }

    // Get pending jobs
    const availableSlots = WORKER_CONFIG.maxConcurrentJobs - activeJobs.size;
    const pendingJobs = await getPendingJobs(availableSlots);

    if (pendingJobs.length === 0) {
      // No jobs to process
      return;
    }

    console.log(`📋 Found ${pendingJobs.length} pending job(s)`);

    // Process jobs concurrently
    const jobPromises = pendingJobs.map(job => processJob(job));
    await Promise.allSettled(jobPromises);

  } catch (error) {
    console.error('❌ Error in worker loop:', error.message);
  }
}

/**
 * Start the worker
 */
async function startWorker() {
  console.log('🤖 SlotVerse VM Worker Starting...');
  console.log('=====================================');
  
  // Initialize database
  if (!(await initDatabase())) {
    process.exit(1);
  }

  // Check required environment variables
  if (!process.env.DISCORD_APPLICATION_ID) {
    console.warn('⚠️  DISCORD_APPLICATION_ID not set - Discord notifications will be disabled');
  }

  isRunning = true;
  console.log(`✅ Worker started with config:`);
  console.log(`   - Poll interval: ${WORKER_CONFIG.pollInterval}ms`);
  console.log(`   - Max concurrent jobs: ${WORKER_CONFIG.maxConcurrentJobs}`);
  console.log(`   - Job timeout: ${WORKER_CONFIG.jobTimeout}ms`);
  console.log('');

  // Start the main loop
  const intervalId = setInterval(workerLoop, WORKER_CONFIG.pollInterval);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down worker...');
    isRunning = false;
    clearInterval(intervalId);
    
    if (connection) {
      connection.end();
    }
    
    console.log('✅ Worker stopped gracefully');
    process.exit(0);
  });

  console.log('🔄 Worker is now polling for jobs...');
}

// Start the worker
startWorker().catch(error => {
  console.error('❌ Failed to start worker:', error.message);
  process.exit(1);
});
