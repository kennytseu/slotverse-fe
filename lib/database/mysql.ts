import mysql from 'mysql2/promise';

// Database connection configuration
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

// Database interfaces
export interface Game {
  id?: number;
  name: string;
  slug: string;
  provider: string;
  rtp?: string;
  volatility?: string;
  max_win?: string;
  features?: string; // JSON string
  description?: string;
  image_url?: string;
  demo_url?: string;
  source_url?: string;
  is_featured?: boolean;
  is_new?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface Provider {
  id?: number;
  name: string;
  slug: string;
  logo_url?: string;
  description?: string;
  game_count?: number;
  is_featured?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

// Game operations
export async function createGame(game: Omit<Game, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
  const connection = getPool();
  
  const [result] = await connection.execute(
    `INSERT INTO games (name, slug, provider, rtp, volatility, max_win, features, description, image_url, demo_url, source_url, is_featured, is_new, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      game.name,
      game.slug,
      game.provider,
      game.rtp ?? null,
      game.volatility ?? null,
      game.max_win ?? null,
      game.features ?? null,
      game.description ?? null,
      game.image_url ?? null,
      game.demo_url ?? null,
      game.source_url ?? null,
      game.is_featured ?? false,
      game.is_new ?? true
    ]
  );
  
  return (result as any).insertId;
}

export async function getGameBySlug(slug: string): Promise<Game | null> {
  const connection = getPool();
  
  const [rows] = await connection.execute(
    'SELECT * FROM games WHERE slug = ? LIMIT 1',
    [slug]
  );
  
  const games = rows as Game[];
  return games.length > 0 ? games[0] : null;
}

export async function getAllGames(limit: number = 50, offset: number = 0): Promise<Game[]> {
  const connection = getPool();
  
  const [rows] = await connection.execute(
    'SELECT * FROM games ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [limit, offset]
  );
  
  return rows as Game[];
}

export async function getFeaturedGames(limit: number = 12): Promise<Game[]> {
  const connection = getPool();
  
  const [rows] = await connection.execute(
    'SELECT * FROM games WHERE is_featured = true ORDER BY created_at DESC LIMIT ?',
    [limit]
  );
  
  return rows as Game[];
}

export async function searchGames(query: string, limit: number = 20): Promise<Game[]> {
  const connection = getPool();
  
  const [rows] = await connection.execute(
    'SELECT * FROM games WHERE name LIKE ? OR provider LIKE ? ORDER BY created_at DESC LIMIT ?',
    [`%${query}%`, `%${query}%`, limit]
  );
  
  return rows as Game[];
}

export async function updateGame(id: number, updates: Partial<Game>): Promise<boolean> {
  const connection = getPool();
  
  const setClause = Object.keys(updates)
    .filter(key => key !== 'id' && key !== 'created_at')
    .map(key => `${key} = ?`)
    .join(', ');
  
  if (!setClause) return false;
  
  const values = Object.keys(updates)
    .filter(key => key !== 'id' && key !== 'created_at')
    .map(key => (updates as any)[key]);
  
  values.push(id);
  
  const [result] = await connection.execute(
    `UPDATE games SET ${setClause}, updated_at = NOW() WHERE id = ?`,
    values
  );
  
  return (result as any).affectedRows > 0;
}

// Provider operations
export async function createProvider(provider: Omit<Provider, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
  const connection = getPool();
  
  const [result] = await connection.execute(
    `INSERT INTO providers (name, slug, logo_url, description, game_count, is_featured, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      provider.name,
      provider.slug,
      provider.logo_url ?? null,
      provider.description ?? null,
      provider.game_count ?? 0,
      provider.is_featured ?? false
    ]
  );
  
  return (result as any).insertId;
}

export async function getProviderBySlug(slug: string): Promise<Provider | null> {
  const connection = getPool();
  
  const [rows] = await connection.execute(
    'SELECT * FROM providers WHERE slug = ? LIMIT 1',
    [slug]
  );
  
  const providers = rows as Provider[];
  return providers.length > 0 ? providers[0] : null;
}

export async function getAllProviders(): Promise<Provider[]> {
  const connection = getPool();
  
  const [rows] = await connection.execute(
    'SELECT * FROM providers ORDER BY name ASC'
  );
  
  return rows as Provider[];
}

export async function updateProviderGameCount(providerName: string): Promise<void> {
  const connection = getPool();
  
  await connection.execute(
    `UPDATE providers SET game_count = (
      SELECT COUNT(*) FROM games WHERE provider = ?
    ), updated_at = NOW() WHERE name = ?`,
    [providerName, providerName]
  );
}

// Utility functions
export function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export async function testConnection(): Promise<boolean> {
  try {
    const connection = getPool();
    await connection.execute('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Initialize database tables (run once)
export async function initializeTables(): Promise<void> {
  const connection = getPool();
  
  // Create games table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS games (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      provider VARCHAR(100) NOT NULL,
      rtp VARCHAR(10),
      volatility ENUM('Low', 'Medium', 'High'),
      max_win VARCHAR(20),
      features JSON,
      description TEXT,
      image_url VARCHAR(500),
      demo_url VARCHAR(500),
      source_url VARCHAR(500),
      is_featured BOOLEAN DEFAULT FALSE,
      is_new BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_provider (provider),
      INDEX idx_featured (is_featured),
      INDEX idx_new (is_new),
      INDEX idx_name (name),
      FULLTEXT idx_search (name, provider)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  
  // Create providers table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS providers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      slug VARCHAR(100) UNIQUE NOT NULL,
      logo_url VARCHAR(500),
      description TEXT,
      game_count INT DEFAULT 0,
      is_featured BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_featured (is_featured),
      INDEX idx_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  
  console.log('Database tables initialized successfully');
}
