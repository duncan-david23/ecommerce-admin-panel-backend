# Database schema for the ecommerce admin panel




-- PRODUCTS TABLE
CREATE TABLE public.products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  skuid TEXT UNIQUE NOT NULL,
  product_name TEXT NOT NULL,
  product_description TEXT,

  product_price NUMERIC(10,2) NOT NULL,
  sales_price NUMERIC(10,2),

  product_discount INTEGER DEFAULT 0,
  product_discount_type TEXT CHECK (product_discount_type IN ('percentage', 'flat')) DEFAULT 'percentage',

  product_stock INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('In Stock', 'Out of Stock', 'Discontinued')) DEFAULT 'In Stock',

  product_categories JSONB DEFAULT '[]'::jsonb,
  product_sizes JSONB DEFAULT '[]'::jsonb,
  product_colors JSONB DEFAULT '[]'::jsonb,
  product_images JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- INDEXES FOR SEARCH + PERFORMANCE
CREATE INDEX idx_products_user_id ON public.products(user_id);
CREATE INDEX idx_products_name ON public.products(product_name);
CREATE INDEX idx_products_categories ON public.products USING GIN (product_categories);
CREATE INDEX idx_products_colors ON public.products USING GIN (product_colors);


-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;


-- Allow only logged-in users to insert their own products
CREATE POLICY "Allow insert for own user"
ON public.products
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to read their own products
CREATE POLICY "Allow select for own user"
ON public.products
FOR SELECT
USING (auth.uid() = user_id);

-- Allow updates only for the owner
CREATE POLICY "Allow update for own user"
ON public.products
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow delete only for the owner
CREATE POLICY "Allow delete for own user"
ON public.products
FOR DELETE
USING (auth.uid() = user_id);


