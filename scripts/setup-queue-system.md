# 🚀 SlotVerse Queue System Setup Guide

## 📋 Overview

This queue-based system bypasses Vercel's external API limitations by:

1. **Vercel**: Instantly saves scraping jobs to MySQL database
2. **Your VM**: Processes pending jobs in background
3. **Discord**: Gets notified when jobs complete

## 🗄️ Step 1: Create Database Table

Run this SQL on your MySQL server:

```bash
mysql -u root -p slotverse < scripts/create-scraping-jobs-table.sql
```

Or manually execute:
```sql
CREATE TABLE IF NOT EXISTS scraping_jobs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  url VARCHAR(500) NOT NULL,
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  discord_channel_id VARCHAR(100),
  discord_interaction_token VARCHAR(200),
  requested_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  error_message TEXT NULL,
  result_data JSON NULL,
  
  INDEX idx_status_created (status, created_at),
  INDEX idx_created_at (created_at),
  INDEX idx_status (status)
);
```

## 🚀 Step 2: Deploy Updated Discord Handler

The `/copy` command now:
- ✅ Instantly saves job to database
- ✅ Returns "Job Queued" message within 3 seconds
- ✅ No external API calls from Vercel

Deploy to Vercel:
```bash
git add .
git commit -m "🔄 Implement queue-based scraping system"
git push origin main
vercel --prod
```

## 🤖 Step 3: Setup VM Background Worker

On your VM, install dependencies:
```bash
npm install mysql2 node-fetch dotenv
```

Copy environment variables to your VM:
```bash
# Create .env file on VM with:
MYSQL_HOST=your_mysql_host
MYSQL_PORT=3306
MYSQL_USER=your_mysql_user
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=slotverse
DISCORD_APPLICATION_ID=your_discord_app_id
```

Start the worker:
```bash
node scripts/vm-worker.js
```

## 🔄 Step 4: Test the System

1. **Test Discord Command**: `/copy https://example.com/game-url`
2. **Expected Response**: "✅ Scraping Job Queued - Job ID: #123"
3. **Check Database**: `SELECT * FROM scraping_jobs ORDER BY created_at DESC LIMIT 5;`
4. **Watch VM Worker**: Should pick up and process the job
5. **Discord Notification**: Should receive completion message

## 📊 Step 5: Monitor the System

### Check Job Status:
```sql
SELECT id, url, status, created_at, started_at, completed_at 
FROM scraping_jobs 
ORDER BY created_at DESC 
LIMIT 10;
```

### View Pending Jobs:
```sql
SELECT * FROM scraping_jobs WHERE status = 'pending';
```

### Check Worker Logs:
```bash
# On VM
tail -f /path/to/worker.log
```

## 🎯 Benefits of This System

### ✅ Vercel Advantages:
- **Fast Response**: < 3 seconds (no timeout errors)
- **No External API Limits**: Only database operations
- **Reliable**: Simple database insert operation
- **Cost Effective**: Minimal Vercel function execution time

### ✅ VM Advantages:
- **Full Control**: No external API restrictions
- **Unlimited Processing**: Can run for hours if needed
- **Better Error Handling**: Full console.log visibility
- **Scalable**: Can run multiple workers

### ✅ User Experience:
- **Immediate Feedback**: Job queued confirmation
- **Progress Tracking**: Job ID for reference
- **Completion Notifications**: Discord alerts when done
- **Reliability**: Jobs won't get lost due to timeouts

## 🛠️ Customization Options

### Worker Configuration:
Edit `WORKER_CONFIG` in `scripts/vm-worker.js`:
```javascript
const WORKER_CONFIG = {
  pollInterval: 5000,      // Check every 5 seconds
  maxConcurrentJobs: 3,    // Process 3 jobs at once
  jobTimeout: 300000,      // 5 minute timeout per job
  retryAttempts: 3,        // Retry failed jobs
  retryDelay: 10000        // Wait 10s between retries
};
```

### Add Your Scraping Logic:
Replace `simulateScrapingProcess()` in `vm-worker.js` with your actual scraping code.

## 🚨 Troubleshooting

### Job Stuck in "pending":
- Check if VM worker is running
- Verify database connection
- Check worker logs for errors

### Discord Notifications Not Working:
- Verify `DISCORD_APPLICATION_ID` in VM environment
- Check interaction token validity (tokens expire)
- Ensure webhook URL is accessible

### Database Connection Issues:
- Verify MySQL credentials
- Check firewall settings
- Ensure database exists

## 🎉 Success!

Your queue system is now ready to handle unlimited scraping jobs without Vercel limitations!
