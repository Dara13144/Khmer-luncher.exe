-- ================================================================
-- NMC CITY RP LAUNCHER - DATABASE SCHEMA & MIGRATIONS
-- Supabase PostgreSQL 15+ compatible with Row Level Security (RLS)
-- ================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Public user profiles linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    in_game_name TEXT DEFAULT '',
    role TEXT DEFAULT 'citizen' CHECK (role IN ('citizen', 'police', 'medic', 'vip', 'admin', 'developer')),
    avatar_url TEXT DEFAULT 'https://minotar.net/avatar/MHF_Steve/64',
    discord_id TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. AUTOMATIC PROFILE CREATION TRIGGER ON AUTH SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, username, in_game_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'in_game_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://minotar.net/avatar/MHF_Steve/64')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. NEWS & ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.news (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT NOT NULL,
    category TEXT DEFAULT 'UPDATE' CHECK (category IN ('UPDATE', 'EVENT', 'MAINTENANCE', 'COMMUNITY')),
    banner_url TEXT DEFAULT 'https://launchercontent.mojang.com/v2/backgrounds/1.21.1.jpg',
    author TEXT DEFAULT 'NMC Staff',
    pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for News
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "News items are readable by anyone" 
ON public.news FOR SELECT USING (true);

-- Insert Default Seed News
INSERT INTO public.news (title, content, summary, category, author, pinned)
VALUES 
(
    'NMC CITY Season 4: Tricky Trials Update',
    'សូមស្វាគមន៍មកកាន់ Season 4 នៃ NMC CITY RP! ការអាប់ដេតនេះរួមបញ្ចូលទាំងរថយន្តថ្មី ប្រព័ន្ធសេដ្ឋកិច្ចថ្មី និង Minecraft 1.21.1 PvP Server ជាមួយ Auto-Mod Synchronizer។',
    'ទីក្រុង NMC CITY Season 4 បានបើកដំណើរការជាផ្លូវការជាមួយមុខងារថ្មីៗ និងប្រព័ន្ធសេដ្ឋកិច្ចថ្មី!',
    'UPDATE',
    'NMC High Command',
    true
),
(
    'Minecraft PvP Tournament 1.21.1',
    'ការប្រកួតប្រជែងដណ្ដើមពានរង្វាន់ប្រចាំសប្ដាហ៍នៅថ្ងៃអាទិត្យ វេលាម៉ោង ៧:០០ យប់។ គាំទ្រប្រព័ន្ធ Reach Display, CPS Tracking, និង Durability HUD ពេញលេញ។',
    'ការប្រកួត PvP ប្រចាំសប្ដាហ៍លើម៉ាស៊ីនបម្រើ Minecraft 1.21.1 ជាមួយរង្វាន់ជាច្រើន!',
    'EVENT',
    'Tournament Director',
    false
)
ON CONFLICT DO NOTHING;
