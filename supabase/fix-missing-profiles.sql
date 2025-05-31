-- Fix Missing User Profiles
-- This creates profiles for users who don't have them

-- First, let's see what users exist
SELECT 
  'Users in auth.users:' as info,
  COUNT(*) as count
FROM auth.users;

-- Show the actual users
SELECT 
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at;

-- Check what profiles exist
SELECT 
  'Profiles in user_profiles:' as info,
  COUNT(*) as count
FROM public.user_profiles;

-- Show existing profiles
SELECT 
  up.id,
  up.full_name,
  up.role,
  au.email
FROM public.user_profiles up
JOIN auth.users au ON up.id = au.id;

-- Create profiles for users who don't have them
INSERT INTO public.user_profiles (id, full_name, role)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'full_name', 'User') as full_name,
  'admin' as role
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles up WHERE up.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- Show the result
SELECT 
  'After fix - Profiles created:' as info,
  COUNT(*) as count
FROM public.user_profiles;

-- Show all profiles with user emails
SELECT 
  up.id,
  up.full_name,
  up.role,
  au.email,
  up.created_at
FROM public.user_profiles up
JOIN auth.users au ON up.id = au.id
ORDER BY up.created_at;
