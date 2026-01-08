-- 1. Create the role column if it doesn't exist (this is idempotent in Postgres using DO block or simple ALTER command)
-- NOTE: If your Postgres version doesn't support 'IF NOT EXISTS' for columns, use the block below.
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'common';

-- 2. Update the default admin user to have the 'master' role
UPDATE users 
SET role = 'master' 
WHERE username = 'admin';

-- 3. Verify the changes (Optional)
-- SELECT id, username, role FROM users;
