const mysql = require('mysql2/promise');
const path = require('path');
const { URL } = require('url');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Parse DATABASE_URL if provided, otherwise use individual environment variables
function getDatabaseConfig() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl) {
    try {
      const url = new URL(databaseUrl);
      
      return {
        host: url.hostname,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1), // Remove leading slash
        port: parseInt(url.port) || 3306,
      };
    } catch (error) {
      console.error('Invalid DATABASE_URL format:', error);
      throw new Error('Invalid DATABASE_URL format. Expected: mysql://username:password@host:port/database');
    }
  }
  
  // Fallback to individual environment variables
  return {
    host: process.env.DATABASE_HOST || 'localhost',
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'visual_product_matcher',
    port: parseInt(process.env.DATABASE_PORT || '3306'),
  };
}

async function migrate() {
  let connection;
  
  try {
    const config = getDatabaseConfig();
    const dbName = config.database;
    
    // Create connection config without database first
    const serverConfig = {
      host: config.host,
      user: config.user,
      password: config.password,
      port: config.port,
    };
    
    console.log('🔌 Connecting to MySQL server...');
    console.log(`Host: ${serverConfig.host}:${serverConfig.port}`);
    console.log(`User: ${serverConfig.user}`);
    console.log(`Target Database: ${dbName}`);
    
    if (process.env.DATABASE_URL) {
      console.log('📝 Using DATABASE_URL configuration');
    } else {
      console.log('📝 Using individual environment variables');
    }
    
    connection = await mysql.createConnection(serverConfig);
    console.log('✅ Connected to MySQL server');
    
    console.log(`📦 Creating database: ${dbName}`);
    
    // Use query() instead of execute() for database commands
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log('✅ Database created');
    
    // Close connection and reconnect to the specific database
    await connection.end();
    
    // Now connect directly to the target database
    console.log('🔄 Reconnecting to target database...');
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to target database');
    
    console.log('🏗️  Creating tables...');
    
    // Products table - use query() for CREATE TABLE statements
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        image_url TEXT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        description TEXT,
        features JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_name (name),
        INDEX idx_price (price)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Products table created');

    // User uploads table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_uploads (
        id INT PRIMARY KEY AUTO_INCREMENT,
        image_path VARCHAR(500) NOT NULL,
        original_filename VARCHAR(255),
        features JSON,
        upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        session_id VARCHAR(100),
        INDEX idx_session (session_id),
        INDEX idx_upload_time (upload_time)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ User uploads table created');

    // Search history table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS search_history (
        id INT PRIMARY KEY AUTO_INCREMENT,
        upload_id INT,
        results JSON,
        filters JSON,
        search_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (upload_id) REFERENCES user_uploads(id) ON DELETE CASCADE,
        INDEX idx_search_time (search_time)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Search history table created');

    // Verify tables were created
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`✅ Migration completed! Created ${tables.length} tables:`);
    tables.forEach((table) => {
      console.log(`   - ${Object.values(table)[0]}`);
    });
    
    console.log('\n🎉 Database migration successful!');
    console.log('📋 Next steps:');
    console.log('   1. Run seeding: npm run db:seed');
    console.log('   2. Start your application');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Error details:', error.message);
    
    // Provide helpful error messages
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('🔑 Access denied. Please check your database credentials.');
      console.error('   DATABASE_URL format: mysql://username:password@host:port/database');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🔌 Connection refused. Please ensure MySQL server is running.');
      console.error('   - Windows: Start MySQL service in Services');
      console.error('   - Mac: brew services start mysql');
      console.error('   - Linux: sudo systemctl start mysql');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('📦 Database access error. Check if the database exists and user has permissions.');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔐 Database connection closed');
    }
  }
}

// Run migration
if (require.main === module) {
  migrate();
}

module.exports = { migrate };