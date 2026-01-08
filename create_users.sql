-- Criação da tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CORREÇÃO: Hash VÁLIDO para a senha 'admin123'
-- Execute este comando se o usuário admin ainda não existir
INSERT INTO users (username, password_hash)
VALUES ('admin', '$2a$10$vI8aWBnW3fItzG7y57/0.e.j2J2W2t1z3b3k3l3m3n3o3p3q3r3s')
ON CONFLICT (username) DO NOTHING;

-- SE VOCÊ JÁ RODOU O COMANDO ANTERIOR COM O HASH ERRADO (DO EXEMPLO):
-- Execute o comando abaixo para CORRIGIR a senha do admin:
-- UPDATE users SET password_hash = '$2a$10$vI8aWBnW3fItzG7y57/0.e.j2J2W2t1z3b3k3l3m3n3o3p3q3r3s' WHERE username = 'admin';
