// debug-env.js - Test environment variable loading
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Environment Variables Debug');
console.log('================================');

console.log('📁 Current directory:', process.cwd());
console.log('📄 Looking for .env.local file...');

const fs = require('fs');
const path = require('path');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('✅ .env.local file found');
  console.log('📋 File contents:');
  console.log(envContent);
} catch (error) {
  console.error('❌ .env.local file not found at:', envPath);
  console.error('📝 Please create .env.local with your database configuration');
  process.exit(1);
}

console.log('\n🔧 Environment Variables:');
console.log('DATABASE_URL:', process.env.DATABASE_URL || 'NOT SET');
console.log('DATABASE_HOST:', process.env.DATABASE_HOST || 'NOT SET');
console.log('DATABASE_USER:', process.env.DATABASE_USER || 'NOT SET');
console.log('DATABASE_PASSWORD:', process.env.DATABASE_PASSWORD ? '[HIDDEN]' : 'NOT SET');
console.log('DATABASE_NAME:', process.env.DATABASE_NAME || 'NOT SET');
console.log('DATABASE_PORT:', process.env.DATABASE_PORT || 'NOT SET');

// Test configuration parsing
console.log('\n⚙️  Configuration Test:');

function getDatabaseConfig() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl) {
    try {
      const { URL } = require('url');
      const url = new URL(databaseUrl);
      
      const config = {
        host: url.hostname,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1),
        port: parseInt(url.port) || 3306,
      };
      
      console.log('✅ Using DATABASE_URL configuration:');
      console.log('   Host:', config.host);
      console.log('   User:', config.user);
      console.log('   Password:', config.password ? '[HIDDEN]' : 'NOT SET');
      console.log('   Database:', config.database);
      console.log('   Port:', config.port);
      
      return config;
    } catch (error) {
      console.error('❌ Invalid DATABASE_URL format:', error.message);
      throw new Error('Invalid DATABASE_URL format');
    }
  }
  
  // Fallback to individual environment variables
  const config = {
    host: process.env.DATABASE_HOST || 'localhost',
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'visual_product_matcher',
    port: parseInt(process.env.DATABASE_PORT || '3306'),
  };
  
  console.log('✅ Using individual environment variables:');
  console.log('   Host:', config.host);
  console.log('   User:', config.user);
  console.log('   Password:', config.password ? '[HIDDEN]' : 'NOT SET');
  console.log('   Database:', config.database);
  console.log('   Port:', config.port);
  
  return config;
}

try {
  const config = getDatabaseConfig();
  
  console.log('\n🎯 Final Configuration:');
  console.log('   Will connect to:', `${config.user}@${config.host}:${config.port}/${config.database}`);
  console.log('   Password provided:', config.password ? 'Yes' : 'No');
  
  if (!config.password) {
    console.error('\n❌ ERROR: No password provided!');
    console.error('💡 Make sure your .env.local file contains the password');
  }
  
} catch (error) {
  console.error('\n❌ Configuration Error:', error.message);
}