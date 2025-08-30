import mysql from 'mysql2/promise';

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'visual_product_matcher',
  port: parseInt(process.env.DB_PORT || '3306'),
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

let connection: mysql.Connection | null = null;

export async function getConnection(): Promise<mysql.Connection> {
  if (!connection) {
    try {
      connection = await mysql.createConnection(dbConfig);
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw new Error('Failed to connect to database');
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
    const conn = await getConnection();
    
    // Test connection
    await conn.ping();
    console.log('Database initialization successful');
    
    // You can add any migration logic here if needed
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

export async function closeConnection(): Promise<void> {
  if (connection) {
    await connection.end();
    connection = null;
    console.log('Database connection closed');
  }
}