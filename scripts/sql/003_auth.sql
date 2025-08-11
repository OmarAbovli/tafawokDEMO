-- Add username/password auth columns and teacher profile fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create super admin with the requested credentials.
INSERT INTO users (id, role, name, email, username, password_hash)
VALUES ('ad_super', 'admin', 'Super Admin', 'admin@tafawok.local', 'superadmin', '321321')
ON CONFLICT (id) DO NOTHING;

-- Ensure demo teacher has a phone (WhatsApp) for CTA on landing
UPDATE users SET phone = COALESCE(phone, '+100000002'), subject = COALESCE(subject, 'Math'), bio = COALESCE(bio, 'Algebra and Geometry')
WHERE id = 't_demo';
