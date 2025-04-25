-- Create products table if it doesn't exist
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100),
  image TEXT,
  perishable BOOLEAN DEFAULT FALSE,
  expiry_date DATE,
  priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high')),
  company VARCHAR(255),
  in_stock BOOLEAN DEFAULT TRUE,
  quantity INTEGER DEFAULT 0,
  rating DECIMAL(3, 2),
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product specifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_specifications (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS products_seller_id_idx ON products(seller_id);
CREATE INDEX IF NOT EXISTS products_category_idx ON products(category);
CREATE INDEX IF NOT EXISTS product_specifications_product_id_idx ON product_specifications(product_id);

-- Insert sample products if the table is empty
INSERT INTO products (
  name, 
  description, 
  price, 
  category, 
  image, 
  perishable, 
  priority, 
  company, 
  in_stock, 
  quantity, 
  rating, 
  seller_id
)
SELECT
  'Premium Headphones',
  'Noise-cancelling wireless headphones with superior sound quality.',
  159.99,
  'electronics',
  'https://placehold.co/300x300/1a1f2c/ffffff?text=Headphones',
  FALSE,
  'medium',
  'AudioTech',
  TRUE,
  25,
  4.8,
  (SELECT id FROM profiles LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);

INSERT INTO products (
  name, 
  description, 
  price, 
  category, 
  image, 
  perishable, 
  priority, 
  company, 
  in_stock, 
  quantity, 
  rating, 
  seller_id
)
SELECT
  'Organic Apples',
  'Fresh and organic apples picked from local farms.',
  5.99,
  'food',
  'https://placehold.co/300x300/1a1f2c/ffffff?text=Apples',
  TRUE,
  'high',
  'FreshFarms',
  TRUE,
  100,
  4.5,
  (SELECT id FROM profiles LIMIT 1)
WHERE EXISTS (SELECT 1 FROM products LIMIT 1) AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Organic Apples');

INSERT INTO products (
  name, 
  description, 
  price, 
  category, 
  image, 
  perishable, 
  priority, 
  company, 
  in_stock, 
  quantity, 
  rating, 
  seller_id
)
SELECT
  'Fantasy Novel',
  'Bestselling fantasy novel set in a magical world.',
  12.99,
  'books',
  'https://placehold.co/300x300/1a1f2c/ffffff?text=Book',
  FALSE,
  'low',
  'BookHouse Publishers',
  TRUE,
  50,
  4.2,
  (SELECT id FROM profiles LIMIT 1)
WHERE EXISTS (SELECT 1 FROM products LIMIT 1) AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Fantasy Novel');

INSERT INTO products (
  name, 
  description, 
  price, 
  category, 
  image, 
  perishable, 
  priority, 
  company, 
  in_stock, 
  quantity, 
  rating, 
  seller_id
)
SELECT
  'Denim Jacket',
  'Classic denim jacket with modern styling.',
  69.99,
  'clothing',
  'https://placehold.co/300x300/1a1f2c/ffffff?text=Jacket',
  FALSE,
  'medium',
  'FashionTrends',
  TRUE,
  15,
  4.1,
  (SELECT id FROM profiles LIMIT 1)
WHERE EXISTS (SELECT 1 FROM products LIMIT 1) AND NOT EXISTS (SELECT 1 FROM products WHERE name = 'Denim Jacket');
