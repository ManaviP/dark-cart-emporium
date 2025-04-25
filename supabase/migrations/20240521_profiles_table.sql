-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('buyer', 'seller', 'admin', 'logistics')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);

-- Add role column if it doesn't exist (in case the table already exists but without the role column)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller', 'admin', 'logistics'));
  END IF;
END
$$;

-- Create a trigger to ensure role is never null
CREATE OR REPLACE FUNCTION ensure_role_not_null()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS NULL THEN
    NEW.role := 'buyer';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_role_not_null_trigger ON profiles;
CREATE TRIGGER ensure_role_not_null_trigger
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION ensure_role_not_null();

-- Create a function to handle new user signups
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Extract role from user metadata if available
  DECLARE
    user_role TEXT;
  BEGIN
    user_role := (NEW.raw_user_meta_data->>'role')::TEXT;
    
    IF user_role IS NULL OR user_role = '' OR user_role NOT IN ('buyer', 'seller', 'admin', 'logistics') THEN
      user_role := 'buyer';
    END IF;
    
    -- Insert a row into public.profiles
    INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      user_role,
      NOW(),
      NOW()
    );
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set up the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();
