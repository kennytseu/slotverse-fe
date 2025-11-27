import mysql from 'mysql2/promise';

// Database connection configuration (reuse existing config)
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

// Create connection pool
let pool: mysql.Pool | null = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

// Scraping job interface
export interface ScrapingJob {
  id?: number;
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  discord_channel_id?: string;
  discord_interaction_token?: string;
  requested_by?: string;
  created_at?: Date;
  started_at?: Date;
  completed_at?: Date;
  error_message?: string;
  result_data?: any; // JSON data
}

/**
 * Create a new scraping job
 */
export async function createScrapingJob(job: Omit<ScrapingJob, 'id' | 'created_at' | 'started_at' | 'completed_at'>): Promise<number> {
  const connection = getPool();
  
  const [result] = await connection.execute(
    `INSERT INTO scraping_jobs (url, status, discord_channel_id, discord_interaction_token, requested_by, created_at) 
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [
      job.url,
      job.status || 'pending',
      job.discord_channel_id || null,
      job.discord_interaction_token || null,
      job.requested_by || null
    ]
  );
  
  return (result as any).insertId;
}

/**
 * Get pending scraping jobs (for VM worker)
 */
export async function getPendingScrapingJobs(limit: number = 10): Promise<ScrapingJob[]> {
  const connection = getPool();
  
  const [rows] = await connection.execute(
    `SELECT * FROM scraping_jobs 
     WHERE status = 'pending' 
     ORDER BY created_at ASC 
     LIMIT ?`,
    [limit]
  );
  
  return rows as ScrapingJob[];
}

/**
 * Update scraping job status
 */
export async function updateScrapingJobStatus(
  id: number, 
  status: ScrapingJob['status'], 
  errorMessage?: string,
  resultData?: any
): Promise<boolean> {
  const connection = getPool();
  
  let query = '';
  let params: any[] = [];
  
  if (status === 'processing') {
    query = `UPDATE scraping_jobs SET status = ?, started_at = NOW() WHERE id = ?`;
    params = [status, id];
  } else if (status === 'completed') {
    query = `UPDATE scraping_jobs SET status = ?, completed_at = NOW(), result_data = ? WHERE id = ?`;
    params = [status, JSON.stringify(resultData || {}), id];
  } else if (status === 'failed') {
    query = `UPDATE scraping_jobs SET status = ?, completed_at = NOW(), error_message = ? WHERE id = ?`;
    params = [status, errorMessage || 'Unknown error', id];
  } else {
    query = `UPDATE scraping_jobs SET status = ? WHERE id = ?`;
    params = [status, id];
  }
  
  const [result] = await connection.execute(query, params);
  return (result as any).affectedRows > 0;
}

/**
 * Get scraping job by ID
 */
export async function getScrapingJobById(id: number): Promise<ScrapingJob | null> {
  const connection = getPool();
  
  const [rows] = await connection.execute(
    'SELECT * FROM scraping_jobs WHERE id = ? LIMIT 1',
    [id]
  );
  
  const jobs = rows as ScrapingJob[];
  return jobs.length > 0 ? jobs[0] : null;
}

/**
 * Get recent scraping jobs (for monitoring)
 */
export async function getRecentScrapingJobs(limit: number = 20): Promise<ScrapingJob[]> {
  const connection = getPool();
  
  const [rows] = await connection.execute(
    `SELECT * FROM scraping_jobs 
     ORDER BY created_at DESC 
     LIMIT ?`,
    [limit]
  );
  
  return rows as ScrapingJob[];
}

/**
 * Clean up old completed jobs (optional maintenance)
 */
export async function cleanupOldJobs(daysOld: number = 30): Promise<number> {
  const connection = getPool();
  
  const [result] = await connection.execute(
    `DELETE FROM scraping_jobs 
     WHERE status IN ('completed', 'failed') 
     AND completed_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [daysOld]
  );
  
  return (result as any).affectedRows;
}
