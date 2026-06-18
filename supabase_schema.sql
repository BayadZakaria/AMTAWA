-- Supabase Schema for Smart Nutrition & Med-Care MVP

-- 1. Users Table
CREATE TABLE public.users (
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
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Medical Profiles
CREATE TABLE public.medical_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  allergies TEXT[] DEFAULT '{}',
  conditions TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Medical Profiles
ALTER TABLE public.medical_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their medical profiles" ON public.medical_profiles FOR ALL USING (auth.uid() = user_id);

-- 3. Medications
CREATE TABLE public.medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  schedule_times TIME[] NOT NULL,
  take_with_food BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their medications" ON public.medications FOR ALL USING (auth.uid() = user_id);

-- 4. Meals (Budget optimized tracking)
CREATE TABLE public.meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_type TEXT CHECK (meal_type IN ('Breakfast', 'Lunch', 'Dinner', 'Snack')),
  total_cost_mad DECIMAL(10, 2),
  food_items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their meals" ON public.meals FOR ALL USING (auth.uid() = user_id);
