-- Create scraping_jobs table for queue-based processing
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
  
  -- Indexes for performance
  INDEX idx_status_created (status, created_at),
  INDEX idx_created_at (created_at),
  INDEX idx_status (status)
);

-- Show table structure
DESCRIBE scraping_jobs;
