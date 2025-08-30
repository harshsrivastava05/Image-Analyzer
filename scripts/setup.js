const mysql = require("mysql2/promise");
const fs = require("fs").promises;
const path = require("path");
require("dotenv").config();

async function setupDatabase() {
  let connection;

  try {
    console.log("🚀 Setting up Visual Product Matcher database...");

    // Connect to MySQL server (without database)
    connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || "localhost",
      user: process.env.DATABASE_USER || "root",
      password: process.env.DATABASE_PASSWORD || "",
      port: parseInt(process.env.DATABASE_PORT || "3306"),
    });

    console.log("✅ Connected to MySQL server");

    // Read and execute schema file
    const schemaPath = path.join(__dirname, "..", "database.sql");
    const schema = await fs.readFile(schemaPath, "utf8");

    // Split schema into individual statements
    const statements = schema
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    console.log(`📄 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await connection.execute(statement);
        console.log(`✅ Executed statement ${i + 1}/${statements.length}`);
      } catch (error) {
        // Skip errors for statements that might already exist
        if (
          !error.message.includes("already exists") &&
          !error.message.includes("Duplicate entry")
        ) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          throw error;
        } else {
          console.log(`⚠️  Skipped statement ${i + 1} (already exists)`);
        }
      }
    }

    // Verify setup
    await connection.execute("USE visual_product_matcher");
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

  const requiredVars = ["DATABASE_HOST", "DATABASE_USER", "DATABASE_NAME"];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error("❌ Missing required environment variables:");
    missingVars.forEach((varName) => {
      console.error(`   - ${varName}`);
    });
    console.error(
      "\n📝 Please create a .env.local file with the required variables."
    );
    console.error("   See .env.example for reference.");
    process.exit(1);
  }

  console.log("✅ Environment variables validated");
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
    await connection.end();
    console.log("✅ Database connection test successful");
  } catch (error) {
    console.error("❌ Database connection test failed:", error.message);
    console.error("\n🔧 Please check your database configuration:");
    console.error("   1. Ensure MySQL server is running");
    console.error("   2. Verify connection credentials");
    console.error("   3. Check if database exists");
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
    console.log("🚀 You can now run: npm run dev");
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
