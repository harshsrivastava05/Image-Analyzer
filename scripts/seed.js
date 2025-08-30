const mysql = require('mysql2/promise');
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

const sampleProducts = [
  {
    name: 'Wireless Bluetooth Headphones',
    category: 'Electronics',
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop',
    price: 99.99,
    description: 'High-quality wireless headphones with noise cancellation'
  },
  {
    name: 'Smart Watch',
    category: 'Electronics',
    image_url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300&h=300&fit=crop',
    price: 199.99,
    description: 'Feature-rich smartwatch with health tracking'
  },
  {
    name: 'Laptop Computer',
    category: 'Electronics',
    image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&h=300&fit=crop',
    price: 899.99,
    description: 'Powerful laptop for work and entertainment'
  },
  {
    name: 'Modern Office Chair',
    category: 'Furniture',
    image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop',
    price: 299.99,
    description: 'Ergonomic office chair with lumbar support'
  },
  {
    name: 'Coffee Maker',
    category: 'Kitchen',
    image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=300&fit=crop',
    price: 79.99,
    description: 'Programmable coffee maker with thermal carafe'
  },
  {
    name: 'Smartphone',
    category: 'Electronics',
    image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop',
    price: 699.99,
    description: 'Latest smartphone with advanced camera system'
  },
  {
    name: 'Indoor Plant Pot',
    category: 'Home & Garden',
    image_url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&h=300&fit=crop',
    price: 24.99,
    description: 'Ceramic plant pot perfect for indoor plants'
  },
  {
    name: 'Desk Lamp',
    category: 'Home & Garden',
    image_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=300&h=300&fit=crop',
    price: 45.99,
    description: 'Adjustable LED desk lamp with touch controls'
  },
  {
    name: 'Wireless Mouse',
    category: 'Electronics',
    image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=300&h=300&fit=crop',
    price: 29.99,
    description: 'Ergonomic wireless mouse with precision tracking'
  },
  {
    name: 'Kitchen Blender',
    category: 'Kitchen',
    image_url: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=300&h=300&fit=crop',
    price: 119.99,
    description: 'High-power blender for smoothies and food prep'
  },
  {
    name: 'Gaming Console',
    category: 'Electronics',
    image_url: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=300&h=300&fit=crop',
    price: 499.99,
    description: 'Next-generation gaming console with 4K support'
  },
  {
    name: 'Bookshelf',
    category: 'Furniture',
    image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop',
    price: 149.99,
    description: 'Modern bookshelf with multiple shelves'
  },
  {
    name: 'Air Purifier',
    category: 'Home & Garden',
    image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop',
    price: 179.99,
    description: 'HEPA air purifier for clean indoor air'
  },
  {
    name: 'Wireless Earbuds',
    category: 'Electronics',
    image_url: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=300&h=300&fit=crop',
    price: 149.99,
    description: 'True wireless earbuds with active noise cancellation'
  },
  {
    name: 'Standing Desk',
    category: 'Furniture',
    image_url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&h=300&fit=crop',
    price: 399.99,
    description: 'Height-adjustable standing desk for better posture'
  },
  {
    name: 'Smart Speaker',
    category: 'Electronics',
    image_url: 'https://images.unsplash.com/photo-1589492477829-5e65395b66cc?w=300&h=300&fit=crop',
    price: 89.99,
    description: 'Voice-controlled smart speaker with AI assistant'
  },
  {
    name: 'Throw Pillow',
    category: 'Home & Garden',
    image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop',
    price: 19.99,
    description: 'Decorative throw pillow for living room'
  },
  {
    name: 'Monitor',
    category: 'Electronics',
    image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=300&h=300&fit=crop',
    price: 299.99,
    description: '4K monitor with HDR support'
  },
  {
    name: 'Table Lamp',
    category: 'Home & Garden',
    image_url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=300&h=300&fit=crop',
    price: 59.99,
    description: 'Modern table lamp with dimmer controls'
  },
  {
    name: 'Mechanical Keyboard',
    category: 'Electronics',
    image_url: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=300&h=300&fit=crop',
    price: 129.99,
    description: 'Mechanical gaming keyboard with RGB lighting'
  }
];

async function seed() {
  let connection;
  
  try {
    const dbConfig = getDatabaseConfig();
    
    console.log('🔌 Connecting to database...');
    console.log(`Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`Database: ${dbConfig.database}`);
    console.log(`User: ${dbConfig.user}`);
    
    if (process.env.DATABASE_URL) {
      console.log('📝 Using DATABASE_URL configuration');
    }
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Check if products already exist
    const [existing] = await connection.query('SELECT COUNT(*) as count FROM products');
    if (existing[0].count > 0) {
      console.log(`⚠️  ${existing[0].count} products already exist`);
      console.log('❓ Do you want to add more sample products? (This will create duplicates)');
      console.log('💡 To reset: DELETE FROM products; then run seed again');
      
      // For automation, let's ask user via a flag
      if (!process.env.FORCE_SEED) {
        console.log('🚫 Skipping seed to avoid duplicates');
        console.log('💡 Set FORCE_SEED=true to add products anyway');
        return;
      }
    }
    
    console.log('🌱 Seeding sample products...');
    
    const query = `
      INSERT INTO products (name, category, image_url, price, description)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    let successCount = 0;
    
    for (let i = 0; i < sampleProducts.length; i++) {
      const product = sampleProducts[i];
      try {
        await connection.execute(query, [
          product.name,
          product.category,
          product.image_url,
          product.price,
          product.description
        ]);
        successCount++;
        console.log(`✅ Added: ${product.name} (${i + 1}/${sampleProducts.length})`);
      } catch (error) {
        console.error(`❌ Failed to add ${product.name}:`, error.message);
      }
    }
    
    // Verify the seeding
    const [finalCount] = await connection.query('SELECT COUNT(*) as count FROM products');
    console.log(`🎉 Seeding completed! Added ${successCount}/${sampleProducts.length} products`);
    console.log(`📊 Total products in database: ${finalCount[0].count}`);
    
    // Show categories
    const [categories] = await connection.query('SELECT DISTINCT category FROM products ORDER BY category');
    console.log('📂 Available categories:');
    categories.forEach(cat => {
      console.log(`   - ${cat.category}`);
    });
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    console.error('Error details:', error.message);
    
    // Provide helpful error messages
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('🔑 Access denied. Please check your database credentials.');
      console.error('   Check DATABASE_URL: mysql://username:password@host:port/database');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🔌 Connection refused. Please ensure MySQL server is running.');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('📦 Database does not exist. Please run migration first: npm run db:migrate');
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      console.error('📋 Tables not found. Please run migration first: npm run db:migrate');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔐 Database connection closed');
    }
  }
}

// Run seeding
if (require.main === module) {
  seed();
}

module.exports = { seed };