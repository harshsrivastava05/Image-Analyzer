-- Create database
CREATE DATABASE IF NOT EXISTS visual_product_matcher;
USE visual_product_matcher;

-- Products table
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    image_url VARCHAR(500),
    rating DECIMAL(3, 2) DEFAULT 0.00,
    review_count INT DEFAULT 0,
    in_stock BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_category (category),
    INDEX idx_brand (brand),
    INDEX idx_price (price),
    FULLTEXT(name, description) -- For full-text search
);

-- Product tags table
CREATE TABLE product_tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    tag VARCHAR(100) NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product_tag (product_id, tag)
);

-- Insert sample products
INSERT INTO products (name, description, category, price, brand, image_url, rating, review_count, in_stock) VALUES
-- Electronics
('iPhone 15 Pro', 'Latest Apple smartphone with titanium design and advanced camera system', 'Electronics', 999.99, 'Apple', 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400', 4.8, 2847, true),
('MacBook Pro 14"', 'Professional laptop with M3 chip and stunning Liquid Retina XDR display', 'Electronics', 1999.99, 'Apple', 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400', 4.9, 1523, true),
('Samsung Galaxy S24 Ultra', 'Premium Android smartphone with S Pen and advanced AI features', 'Electronics', 1199.99, 'Samsung', 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400', 4.7, 3241, true),
('AirPods Pro', 'Wireless earbuds with active noise cancellation', 'Electronics', 249.99, 'Apple', 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400', 4.6, 8932, true),
('Nintendo Switch OLED', 'Gaming console with vibrant OLED screen', 'Electronics', 349.99, 'Nintendo', 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400', 4.8, 5674, true),

-- Fashion
('Nike Air Jordan 1', 'Classic basketball sneakers with iconic design', 'Fashion', 170.00, 'Nike', 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400', 4.7, 12543, true),
('Adidas Ultraboost 22', 'Premium running shoes with responsive cushioning', 'Fashion', 190.00, 'Adidas', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', 4.6, 8765, true),
('Ray-Ban Aviator', 'Classic aviator sunglasses with premium lenses', 'Fashion', 154.00, 'Ray-Ban', 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400', 4.5, 6789, true),
('Levi\'s 501 Original Jeans', 'Classic straight-fit denim jeans', 'Fashion', 69.99, 'Levi\'s', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400', 4.4, 15432, true),
('Patagonia Down Sweater', 'Lightweight insulated jacket for outdoor adventures', 'Fashion', 229.00, 'Patagonia', 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400', 4.8, 3456, true),

-- Home & Living
('Dyson V15 Detect', 'Cordless vacuum with laser dust detection', 'Home & Living', 749.99, 'Dyson', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', 4.7, 4567, true),
('KitchenAid Stand Mixer', 'Professional-grade stand mixer for baking', 'Home & Living', 379.99, 'KitchenAid', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400', 4.9, 8765, true),
('Herman Miller Aeron Chair', 'Ergonomic office chair with premium design', 'Home & Living', 1395.00, 'Herman Miller', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400', 4.8, 2134, true),
('Nest Learning Thermostat', 'Smart thermostat that learns your schedule', 'Home & Living', 249.99, 'Google', 'https://images.unsplash.com/photo-1545259741-2ea3ebf61fa0?w=400', 4.6, 6789, true),
('Instant Pot Duo 7-in-1', 'Multi-use pressure cooker and slow cooker', 'Home & Living', 99.99, 'Instant Pot', 'https://images.unsplash.com/photo-1585515656406-0b2ebf3578f6?w=400', 4.7, 23456, true),

-- Beauty & Health
('Dyson Airwrap', 'Multi-styler for hair drying and styling', 'Beauty & Health', 599.99, 'Dyson', 'https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=400', 4.5, 7890, true),
('Fitbit Versa 4', 'Advanced fitness smartwatch with GPS', 'Beauty & Health', 199.99, 'Fitbit', 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400', 4.4, 12345, true),
('Theragun Elite', 'Percussive therapy device for muscle recovery', 'Beauty & Health', 399.99, 'Therabody', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400', 4.6, 5678, true),
('Oura Ring Gen3', 'Smart ring for sleep and health tracking', 'Beauty & Health', 299.99, 'Oura', 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=400', 4.3, 3456, true),
('CeraVe Moisturizing Cream', 'Daily facial moisturizer with ceramides', 'Beauty & Health', 16.99, 'CeraVe', 'https://images.unsplash.com/photo-1556228578-dd6acdd58e94?w=400', 4.7, 34567, true),

-- Sports & Outdoors
('Yeti Rambler 30oz', 'Insulated stainless steel tumbler', 'Sports & Outdoors', 39.99, 'Yeti', 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400', 4.8, 8765, true),
('REI Co-op Flash 22 Pack', 'Lightweight daypack for hiking', 'Sports & Outdoors', 59.95, 'REI Co-op', 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400', 4.6, 2345, true),
('Hydro Flask Water Bottle', '32oz insulated water bottle', 'Sports & Outdoors', 44.95, 'Hydro Flask', 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400', 4.7, 15678, true),
('Coleman Sundome Tent', '4-person camping tent with easy setup', 'Sports & Outdoors', 89.99, 'Coleman', 'https://images.unsplash.com/photo-1504851149312-7a075b496cc7?w=400', 4.4, 6789, true),
('Osprey Atmos AG 65', 'Backpacking pack with anti-gravity suspension', 'Sports & Outdoors', 270.00, 'Osprey', 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400', 4.9, 1234, true);

-- Insert product tags
INSERT INTO product_tags (product_id, tag) VALUES
-- iPhone tags
(1, 'smartphone'), (1, 'ios'), (1, 'camera'), (1, 'titanium'), (1, 'wireless'),
-- MacBook tags  
(2, 'laptop'), (2, 'computer'), (2, 'professional'), (2, 'm3'), (2, 'retina'),
-- Samsung tags
(3, 'smartphone'), (3, 'android'), (3, 'spen'), (3, 'camera'), (3, 'premium'),
-- Continue for other products...
(4, 'earbuds'), (4, 'wireless'), (4, 'noise-canceling'),
(5, 'gaming'), (5, 'console'), (5, 'oled'), (5, 'portable');
