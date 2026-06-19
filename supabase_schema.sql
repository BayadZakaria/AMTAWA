-- Supabase Schema for Smart Nutrition & Med-Care MVP

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  daily_budget_mad DECIMAL(10, 2) NOT NULL DEFAULT 50.00,
  name TEXT,
  tokens INTEGER DEFAULT 5,
  age INTEGER,
  weight_kg DECIMAL(5,2),
  height_cm DECIMAL(5,2)
);

-- Enable RLS for Users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Medical Profiles
CREATE TABLE IF NOT EXISTS public.medical_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  allergies TEXT[] DEFAULT '{}',
  conditions TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Medical Profiles
ALTER TABLE public.medical_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their medical profiles" ON public.medical_profiles;
CREATE POLICY "Users can manage their medical profiles" ON public.medical_profiles FOR ALL USING (auth.uid() = user_id);

-- 3. Medications
CREATE TABLE IF NOT EXISTS public.medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  schedule_times TIME[] NOT NULL,
  take_with_food BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their medications" ON public.medications;
CREATE POLICY "Users can manage their medications" ON public.medications FOR ALL USING (auth.uid() = user_id);

-- 4. Meals (Budget optimized tracking)
CREATE TABLE IF NOT EXISTS public.meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type TEXT CHECK (meal_type IN ('Breakfast', 'Lunch', 'Dinner', 'Snack')),
  total_cost_mad DECIMAL(10, 2),
  food_items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their meals" ON public.meals;
CREATE POLICY "Users can manage their meals" ON public.meals FOR ALL USING (auth.uid() = user_id);

-- 5. History Table
CREATE TABLE IF NOT EXISTS public.activity_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  activity_type TEXT CHECK (activity_type IN ('scan', 'meal', 'fitness')),
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.activity_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their history" ON public.activity_history;
CREATE POLICY "Users can manage their history" ON public.activity_history FOR ALL USING (auth.uid() = user_id);

-- 6. Product Reviews Table
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barcode TEXT NOT NULL,
  user_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
-- For now, public can read and insert reviews
DROP POLICY IF EXISTS "Anyone can read reviews" ON public.product_reviews;
CREATE POLICY "Anyone can read reviews" ON public.product_reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert reviews" ON public.product_reviews;
CREATE POLICY "Anyone can insert reviews" ON public.product_reviews FOR INSERT WITH CHECK (true);

