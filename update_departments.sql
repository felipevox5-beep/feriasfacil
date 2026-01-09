-- 1. Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Seed default departments (only if they don't exist)
INSERT INTO departments (name) VALUES 
('Geral'), 
('TI'), 
('RH'), 
('Comercial'), 
('Financeiro'), 
('Operações')
ON CONFLICT (name) DO NOTHING;
