const mysql = require("mysql2/promise");
const fs = require("fs").promises;
const path = require("path");

// Load environment variables
require("dotenv").config({ path: ".env.local" });

async function setupDatabase() {
  let connection;

  try {
    console.log("🚀 Setting up Visual Product Matcher database...");

    // Connect to MySQL server (without database)
    const serverConfig = {
      host: process.env.DATABASE_HOST || "localhost",
      user: process.env.DATABASE_USER || "root",
      password: process.env.DATABASE_PASSWORD || "",
      port: parseInt(process.env.DATABASE_PORT || "3306"),
    };

    console.log("🔌 Connecting to MySQL server...");
    console.log(`Host: ${serverConfig.host}:${serverConfig.port}`);
    console.log(`User: ${serverConfig.user}`);

    connection = await mysql.createConnection(serverConfig);
    console.log("✅ Connected to MySQL server");

    const dbName = process.env.DATABASE_NAME || "visual_product_matcher";
    
    // Create database
    console.log(`📦 Creating database: ${dbName}`);
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.execute(`USE \`${dbName}\``);
    console.log("✅ Database created and selected");

    console.log("🏗️  Creating tables...");

    // Products table
    await connection.execute(`
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
    console.log("✅ Products table created");

    // User uploads table
    await connection.execute(`
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
    console.log("✅ User uploads table created");

    // Search history table
    await connection.execute(`
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
    console.log("✅ Search history table created");

    // Verify setup
    const [tables] = await connection.execute("SHOW TABLES");
    console.log(`✅ Database setup complete. Found ${tables.length} tables:`);
    tables.forEach((table) => {
      console.log(`   - ${Object.values(table)[0]}`);
    });

    // Check product count
    const [productCount] = await connection.execute(
      "SELECT COUNT(*) as count FROM products"
    );
    console.log(`📦 Products in database: ${productCount[0].count}`);

    console.log("🎉 Database setup completed successfully!");
  } catch (error) {
    console.error("❌ Database setup failed:", error);
    console.error("Error details:", error.message);
    
    // Provide helpful error messages
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('🔑 Access denied. Please check your database credentials in .env.local');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🔌 Connection refused. Please ensure MySQL server is running.');
      console.error('   - On Windows: Start MySQL service');
      console.error('   - On Mac: brew services start mysql');
      console.error('   - On Linux: sudo systemctl start mysql');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("🔐 Database connection closed");
    }
  }
}

async function createUploadsDirectory() {
  try {
    const uploadDir = process.env.UPLOAD_DIR || "./public/uploads";
    await fs.mkdir(uploadDir, { recursive: true });
    console.log(`📁 Created uploads directory: ${uploadDir}`);

    // Create .gitkeep to ensure directory exists in git
    const gitkeepPath = path.join(uploadDir, ".gitkeep");
    await fs.writeFile(gitkeepPath, "");
    console.log("📄 Created .gitkeep file");
  } catch (error) {
    console.error("❌ Failed to create uploads directory:", error);
    throw error;
  }
}

async function validateEnvironment() {
  console.log("🔍 Validating environment variables...");

  // Check if .env.local exists
  try {
    await fs.access('.env.local');
    console.log("✅ Found .env.local file");
  } catch (error) {
    console.error("❌ .env.local file not found");
    console.error("📝 Please create .env.local with your database configuration");
    process.exit(1);
  }

  const requiredVars = ["DATABASE_HOST", "DATABASE_USER", "DATABASE_NAME"];
  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error("❌ Missing required environment variables:");
    missingVars.forEach((varName) => {
      console.error(`   - ${varName}`);
    });
    console.error("\n📝 Please add these variables to your .env.local file");
    process.exit(1);
  }

  console.log("✅ Environment variables validated");
  console.log(`   Database: ${process.env.DATABASE_NAME}`);
  console.log(`   Host: ${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}`);
  console.log(`   User: ${process.env.DATABASE_USER}`);
}

async function testDatabaseConnection() {
  console.log("🔌 Testing database connection...");

  try {
    const connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      port: parseInt(process.env.DATABASE_PORT || "3306"),
    });

    await connection.ping();
    console.log("✅ Database connection test successful");
    
    // Test a simple query
    const [result] = await connection.execute('SELECT 1 as test');
    console.log("✅ Database query test successful");
    
    await connection.end();
  } catch (error) {
    console.error("❌ Database connection test failed:", error.message);
    console.error("\n🔧 Troubleshooting steps:");
    console.error("   1. Ensure MySQL server is running");
    console.error("   2. Verify connection credentials in .env.local");
    console.error("   3. Check if the database exists");
    console.error("   4. Verify MySQL port (default: 3306)");
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error("\n🔑 Access denied - check username/password");
    } else if (error.code === 'ECONNREFUSED') {
      console.error("\n🔌 Connection refused - is MySQL running?");
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error("\n📦 Database doesn't exist - it will be created during migration");
    }
    
    throw error;
  }
}

// Main setup function
async function main() {
  try {
    console.log("🎯 Visual Product Matcher Setup Script");
    console.log("=====================================\n");

    await validateEnvironment();
    await createUploadsDirectory();
    await setupDatabase();
    await testDatabaseConnection();

    console.log("\n🎉 Setup completed successfully!");
    console.log("\n📋 Next steps:");
    console.log("   1. Run seeding: npm run db:seed");
    console.log("   2. Start development: npm run dev");
    console.log("   3. Visit: http://localhost:3000");
    
  } catch (error) {
    console.error("\n💥 Setup failed:", error.message);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  main();
}

module.exports = {
  setupDatabase,
  createUploadsDirectory,
  validateEnvironment,
  testDatabaseConnection,
};