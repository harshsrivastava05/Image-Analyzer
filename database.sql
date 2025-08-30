CREATE DATABASE IF NOT EXISTS visual_product_matcher;
USE visual_product_matcher;

-- Products table
CREATE TABLE products (
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
);

-- User uploads table (for tracking uploaded images)
CREATE TABLE user_uploads (
  id INT PRIMARY KEY AUTO_INCREMENT,
  image_path VARCHAR(500) NOT NULL,
  original_filename VARCHAR(255),
  features JSON,
  upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  session_id VARCHAR(100),
  INDEX idx_session (session_id),
  INDEX idx_upload_time (upload_time)
);

-- Search history table
CREATE TABLE search_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  upload_id INT,
  results JSON,
  filters JSON,
  search_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (upload_id) REFERENCES user_uploads(id) ON DELETE CASCADE,
  INDEX idx_search_time (search_time)
);

-- Insert sample products
INSERT INTO products (name, category, image_url, price, description) VALUES
('Wireless Bluetooth Headphones', 'Electronics', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop', 99.99, 'High-quality wireless headphones with noise cancellation'),
('Smart Watch', 'Electronics', 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300&h=300&fit=crop', 199.99, 'Feature-rich smartwatch with health tracking'),
('Laptop Computer', 'Electronics', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&h=300&fit=crop', 899.99, 'Powerful laptop for work and entertainment'),
('Modern Office Chair', 'Furniture', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop', 299.99, 'Ergonomic office chair with lumbar support'),
('Coffee Maker', 'Kitchen', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=300&fit=crop', 79.99, 'Programmable coffee maker with thermal carafe'),
('Smartphone', 'Electronics', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&h=300&fit=crop', 699.99, 'Latest smartphone with advanced camera system'),
('Indoor Plant Pot', 'Home & Garden', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&h=300&fit=crop', 24.99, 'Ceramic plant pot perfect for indoor plants'),
('Desk Lamp', 'Home & Garden', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=300&h=300&fit=crop', 45.99, 'Adjustable LED desk lamp with touch controls'),
('Wireless Mouse', 'Electronics', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=300&h=300&fit=crop', 29.99, 'Ergonomic wireless mouse with precision tracking'),
('Kitchen Blender', 'Kitchen', 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=300&h=300&fit=crop', 119.99, 'High-power blender for smoothies and food prep'),
('Gaming Console', 'Electronics', 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=300&h=300&fit=crop', 499.99, 'Next-generation gaming console with 4K support'),
('Bookshelf', 'Furniture', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop', 149.99, 'Modern bookshelf with multiple shelves'),
('Air Purifier', 'Home & Garden', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop', 179.99, 'HEPA air purifier for clean indoor air'),
('Wireless Earbuds', 'Electronics', 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=300&h=300&fit=crop', 149.99, 'True wireless earbuds with active noise cancellation'),
('Standing Desk', 'Furniture', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&h=300&fit=crop', 399.99, 'Height-adjustable standing desk for better posture'),
('Smart Speaker', 'Electronics', 'https://images.unsplash.com/photo-1589492477829-5e65395b66cc?w=300&h=300&fit=crop', 89.99, 'Voice-controlled smart speaker with AI assistant'),
('Throw Pillow', 'Home & Garden', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop', 19.99, 'Decorative throw pillow for living room'),
('Monitor', 'Electronics', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=300&h=300&fit=crop', 299.99, '4K monitor with HDR support'),
('Table Lamp', 'Home & Garden', 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=300&h=300&fit=crop', 59.99, 'Modern table lamp with dimmer controls'),
('Mechanical Keyboard', 'Electronics', 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=300&h=300&fit=crop', 129.99, 'Mechanical gaming keyboard with RGB lighting');