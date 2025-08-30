import mysql from 'mysql2/promise';

// Database connection configuration
const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'visual_product_matcher',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  charset: 'utf8mb4'
};

let connection: mysql.Connection | null = null;

export async function getConnection(): Promise<mysql.Connection> {
  if (!connection) {
    try {
      console.log('Establishing database connection...');
      connection = await mysql.createConnection(dbConfig);
      console.log('Database connected successfully');
    } catch (error: any) {
      console.error('Database connection failed:', error);
      
      // Provide helpful error messages
      if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        throw new Error('Database access denied. Please check your credentials.');
      } else if (error.code === 'ECONNREFUSED') {
        throw new Error('Database connection refused. Please ensure MySQL server is running.');
      } else if (error.code === 'ER_BAD_DB_ERROR') {
        throw new Error('Database does not exist. Please run migration first.');
      }
      
      throw new Error(`Failed to connect to database: ${error.message}`);
    }
  }
  return connection;
}

export async function executeQuery(query: string, params: any[] = []): Promise<any[]> {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(query, params);
    return Array.isArray(rows) ? rows : [];
  } catch (error: any) {
    console.error('Query execution error:', error);
    console.error('Query:', query);
    console.error('Params:', params);
    throw new Error(`Database query failed: ${error.message}`);
  }
}

// Database models
export interface Product {
  id: number;
  name: string;
  category: string;
  image_url: string;
  price: number;
  description?: string;
  features?: number[];
  created_at: Date;
  updated_at: Date;
}

export interface UserUpload {
  id: number;
  image_path: string;
  original_filename?: string;
  features?: number[];
  upload_time: Date;
  session_id?: string;
}

export interface SearchResult extends Product {
  similarity: number;
  matchScore: number; // Similarity as percentage
}

export interface SearchHistory {
  id: number;
  upload_id: number;
  results: SearchResult[];
  filters: {
    category?: string;
    minSimilarity?: number;
  };
  search_time: Date;
}

// Database utility functions
export async function initializeDatabase(): Promise<void> {
  try {
    console.log('Initializing database connection...');
    const conn = await getConnection();
    
    // Test connection
    await conn.ping();
    console.log('Database initialization successful');
    
    // Verify tables exist, casting to an array to access length
    const [tables] = await conn.execute('SHOW TABLES') as [any[], any];
    console.log(`Found ${tables.length} tables in database`);
    
    if (tables.length === 0) {
      console.warn('⚠️  No tables found. Please run migration: npm run db:migrate');
    }
    
  } catch (error: any) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

export async function closeConnection(): Promise<void> {
  if (connection) {
    try {
      await connection.end();
      connection = null;
      console.log('Database connection closed');
    } catch (error) {
      console.error('Error closing database connection:', error);
    }
  }
}

// Health check function
export async function healthCheck(): Promise<boolean> {
  try {
    const conn = await getConnection();
    await conn.ping();
    
    // Test a simple query
    await conn.execute('SELECT 1');
    
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, closing database connection...');
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, closing database connection...');
  await closeConnection();
  process.exit(0);
});