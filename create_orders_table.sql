-- 📦 ORDERS TABLE - For real order data
-- Run this in Supabase SQL Editor to create the orders table

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    items JSONB DEFAULT '[]'::jsonb,
    total DECIMAL(10,2) NOT NULL,
    shipping_address TEXT,
    estimated_delivery DATE,
    tracking_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders" ON public.orders
    FOR UPDATE USING (auth.uid() = user_id);

-- Insert sample test data
INSERT INTO public.orders (order_number, customer_name, customer_email, status, items, total, shipping_address, estimated_delivery, tracking_number)
VALUES 
    ('ORD123456', 'John Doe', 'john@example.com', 'shipped', 
     '[{"name": "Wireless Headphones", "quantity": 1, "price": 79.99}, {"name": "USB-C Cable", "quantity": 2, "price": 9.99}]'::jsonb,
     99.97, '123 Main St, New York, NY 10001', '2024-01-15', '1Z999AA1234567890'),
    
    ('ORD789012', 'Jane Smith', 'jane@example.com', 'processing',
     '[{"name": "Laptop Stand", "quantity": 1, "price": 49.99}]'::jsonb,
     49.99, '456 Oak Ave, Los Angeles, CA 90001', '2024-01-20', NULL),
    
    ('ORD345678', 'Bob Johnson', 'bob@example.com', 'delivered',
     '[{"name": "Mechanical Keyboard", "quantity": 1, "price": 129.99}, {"name": "Mouse Pad", "quantity": 1, "price": 19.99}]'::jsonb,
     149.98, '789 Pine St, Chicago, IL 60601', '2024-01-10', '1Z888BB9876543210')
ON CONFLICT (order_number) DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Orders table created!';
    RAISE NOTICE '📦 Sample orders inserted';
    RAISE NOTICE '🔒 RLS policies enabled';
    RAISE NOTICE '🎯 Ready to test with real data!';
END $$;
