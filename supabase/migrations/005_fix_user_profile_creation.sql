-- Fix user profile creation issues
-- 1. Make surname and first_name nullable to allow profile creation for all OAuth providers
-- 2. Update the trigger to properly parse names from OAuth providers
-- 3. Ensure existing records are not affected

-- Make first_name and surname nullable (they can be filled during onboarding)
ALTER TABLE user_profiles 
ALTER COLUMN first_name DROP NOT NULL,
ALTER COLUMN surname DROP NOT NULL;

-- Update the trigger function to populate both surname and last_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_first_name TEXT;
  user_last_name TEXT;
  full_name_text TEXT;
  name_parts TEXT[];
BEGIN
  -- Try to get the full name from various metadata fields
  full_name_text := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'first_name'
  );
  
  -- Parse the name intelligently
  IF full_name_text IS NOT NULL AND full_name_text != '' THEN
    -- Split the full name by spaces
    name_parts := string_to_array(trim(full_name_text), ' ');
    
    IF array_length(name_parts, 1) = 1 THEN
      -- Only one name provided
      user_first_name := name_parts[1];
      user_last_name := '';
    ELSIF array_length(name_parts, 1) >= 2 THEN
      -- Multiple names: first part is first name, rest is last name
      user_first_name := name_parts[1];
      user_last_name := array_to_string(name_parts[2:array_length(name_parts, 1)], ' ');
    END IF;
  END IF;
  
  -- Fall back to individual fields if parsing failed
  user_first_name := COALESCE(
    NULLIF(user_first_name, ''),
    NEW.raw_user_meta_data->>'first_name',
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN split_part(NEW.email, '@', 1) ELSE 'User' END
  );
  
  user_last_name := COALESCE(
    NULLIF(user_last_name, ''),
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'surname',
    ''
  );
  
  -- Insert the profile (use COALESCE to ensure we never insert NULL for required fields with defaults)
  INSERT INTO public.user_profiles (
    id, 
    email, 
    first_name, 
    surname,
    mobile_number,
    preferred_language
  )
  VALUES (
    NEW.id, 
    NEW.email,
    user_first_name,
    user_last_name,
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en')
  )
  ON CONFLICT (id) DO NOTHING;  -- Prevent duplicate key errors
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't prevent user creation
    RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The trigger already exists, no need to recreate it
-- It will automatically use the updated function

COMMENT ON FUNCTION public.handle_new_user IS 'Automatically creates user profile when a new user signs up. Handles various OAuth providers and email signups.';
