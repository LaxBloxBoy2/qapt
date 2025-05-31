# Supabase Setup for QAPT

This directory contains the SQL scripts needed to set up the Supabase backend for QAPT.

## Setup Instructions

1. Create a new Supabase project at [https://app.supabase.com](https://app.supabase.com)

2. Once your project is created, go to the SQL Editor in the Supabase dashboard

3. Copy the contents of `schema.sql` and paste it into the SQL Editor

4. Run the SQL script to create the necessary tables, policies, and triggers

5. Go to Authentication > Settings and configure the following:
   - Enable Email/Password sign-in
   - Configure email templates if desired
   - Set the Site URL to your frontend URL (e.g., http://localhost:3000 for development)
   - Under "Redirect URLs", add:
     - http://localhost:3000/login
     - http://localhost:3000/signup
     - http://localhost:3000/dashboard

6. Get your Supabase URL and anon key from Project Settings > API

7. Update your `.env.local` file with the Supabase URL and anon key:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

## Database Schema

### user_profiles

This table stores additional information for each user authenticated via Supabase Auth.

```sql
CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'team_member')),
  created_at TIMESTAMP DEFAULT now()
);
```

| Column     | Type      | Description                           |
|------------|-----------|---------------------------------------|
| id         | uuid      | Primary key, references auth.users(id) |
| full_name  | text      | User's full name                      |
| role       | text      | Either 'admin' or 'team_member'       |
| created_at | timestamp | When the profile was created          |

## Row-Level Security (RLS)

RLS is enabled on the `user_profiles` table to restrict access by logged-in user:

```sql
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own profile"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = id);
```

## Triggers

A trigger is set up to automatically create a user profile when a new user signs up:

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Testing

To test the setup:

1. Create a new user via the signup page
2. Confirm the email (check the Auth > Users section in Supabase)
3. Log in with the new user
4. Verify that you can access the dashboard

## Troubleshooting

If you encounter issues:

1. Check the browser console for error messages
2. Verify that the user exists in the Auth > Users section of Supabase
3. Check that a corresponding entry exists in the `user_profiles` table
4. Ensure that RLS policies are correctly applied
5. Verify that your environment variables are correctly set
