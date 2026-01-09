import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ferias-facil-secret-key-change-me';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 80;

// Middlewares
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do React (após build)
app.use(express.static(path.join(__dirname, '../dist')));

// --- Middleware de Autenticação e Autorização ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const requireMaster = (req, res, next) => {
    if (req.user && req.user.role === 'master') {
        next();
    } else {
        res.status(403).json({ error: 'Acesso negado: Requer privilégios Master' });
    }
};

// --- API Endpoint IA ---
app.post('/api/chat', authenticateToken, async (req, res) => {
    const { prompt, context } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt é obrigatório' });
    }

    if (!process.env.GEMINI_API_KEY) {
        console.error('ERRO: GEMINI_API_KEY não configurada no ambiente.');
        return res.status(500).json({ error: 'Erro de Configuração: Chave da IA (GEMINI_API_KEY) não encontrada no servidor.' });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : "";
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        // Construir um prompt enriquecido com o contexto dos colaboradores
        const systemInstruction = `
      Você é um especialista em legislação trabalhista brasileira (CLT) e gestão de RH.
      Seu objetivo é ajudar gestores a planejar férias.
      
      Contexto dos Colaboradores da Empresa:
      ${JSON.stringify(context || [])}
      
      Responda de forma concisa, profissional e focada na legislação brasileira.
      Se a pergunta for sobre um colaborador específico, use os dados fornecidos.
    `;

        const fullPrompt = `${systemInstruction}\n\nUsuário: ${prompt}`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        res.json({ text });
    } catch (err) {
        console.error('Erro na API Gemini:', err);
        res.status(500).json({ error: 'Erro ao processar resposta da IA', details: err.message });
    }
});

// --- API Endpoints Colaboradores ---

// --- API Endpoints Colaboradores ---

// 1. Listar Colaboradores
app.get('/api/employees', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM employees ORDER BY name ASC');
        // Mapear campos do banco (snake_case) para o frontend (camelCase) se necessário
        // No SQL criado: admission_date, last_vacation_end. No Front: admissionDate, lastVacationEnd
        const formatted = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            role: row.role,
            department: row.department,
            admissionDate: row.admission_date ? new Date(row.admission_date).toISOString().split('T')[0] : null,
            lastVacationEnd: row.last_vacation_end ? new Date(row.last_vacation_end).toISOString().split('T')[0] : null
        }));
        res.json(formatted);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar colaboradores' });
    }
});

// --- Auto-Migration: Atualizar Schema se necessário ---
const runMigrations = async () => {
    try {
        // 1. Atualizar tabelas existentes
        await db.query(`
            ALTER TABLE vacations ADD COLUMN IF NOT EXISTS notice_sent BOOLEAN DEFAULT FALSE;
            ALTER TABLE vacations ADD COLUMN IF NOT EXISTS advance_13th BOOLEAN DEFAULT FALSE;
        `);

        // 2. Criar tabela de usuários se não existir
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                username VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'common',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            
            ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'common';
        `);

        // 3. Criar tabela de departamentos se não existir
        await db.query(`
            CREATE TABLE IF NOT EXISTS departments (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(255) UNIQUE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 4. Seed de departamentos padrão se a tabela estiver vazia
        const deptCheck = await db.query('SELECT count(*) FROM departments');
        if (parseInt(deptCheck.rows[0].count) === 0) {
            const defaultDepts = ['Geral', 'TI', 'RH', 'Comercial', 'Financeiro', 'Operações'];
            for (const dept of defaultDepts) {
                await db.query('INSERT INTO departments (name) VALUES ($1) ON CONFLICT DO NOTHING', [dept]);
            }
            console.log('Departamentos padrão inseridos.');
        }

        // 5. Garantir que o usuário admin existe com a senha correta e role 'master'
        // Gera um novo hash para 'admin123'
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('admin123', salt);

        // Upsert do admin (Insere ou Atualiza)
        await db.query(`
            INSERT INTO users (username, password_hash, role) 
            VALUES ('admin', $1, 'master')
            ON CONFLICT (username) 
            DO UPDATE SET password_hash = $1, role = 'master'
        `, [hash]);

        console.log('Usuário admin verificado/atualizado (user: admin, pass: admin123, role: master)');

        console.log('Migração de Schema e Seed executados com sucesso.');
    } catch (err) {
        console.error('Erro na migração de schema:', err);
    }
};

// --- API Auth ---
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(`[AUTH] Tentativa de login para usuário: ${username}`);

    try {
        const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        if (!user) {
            console.log(`[AUTH] Falha: Usuário '${username}' não encontrado.`);
            return res.status(400).json({ error: 'Usuário não encontrado' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            console.log(`[AUTH] Falha: Senha incorreta para '${username}'.`);
            return res.status(400).json({ error: 'Senha incorreta' });
        }

        console.log(`[AUTH] Sucesso: Login realizado para '${username}'.`);
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ token, username: user.username, role: user.role });
    } catch (err) {
        console.error('[AUTH] Erro no servidor durante login:', err);
        res.status(500).json({ error: 'Erro no login' });
    }
});

app.post('/api/auth/verify', authenticateToken, (req, res) => {
    res.json({ valid: true, user: req.user });
});

// --- API Endpoints Usuários (Gerenciamento) ---
// Listar Usuários
app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT id, username, role, created_at FROM users ORDER BY username ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao listar usuários' });
    }
});

// Criar Usuário (Apenas Master pode criar novos usuários)
app.post('/api/users', authenticateToken, requireMaster, async (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Usuário e senha obrigatórios' });

    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const finalRole = role || 'common'; // Default role

        const result = await db.query(
            'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role',
            [username, hash, finalRole]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        if (err.constraint === 'users_username_key') {
            return res.status(400).json({ error: 'Nome de usuário já existe' });
        }
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
});

// Editar Usuário (Apenas Master)
app.put('/api/users/:id', authenticateToken, requireMaster, async (req, res) => {
    const { id } = req.params;
    const { password, role } = req.body;

    try {
        let query, params;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            query = 'UPDATE users SET password_hash = $1, role = $2 WHERE id = $3 RETURNING id, username, role';
            params = [hash, role || 'common', id];
        } else {
            query = 'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, role';
            params = [role || 'common', id];
        }

        const result = await db.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
});

// Deletar Usuário (Apenas Master)
app.delete('/api/users/:id', authenticateToken, requireMaster, async (req, res) => {
    const { id } = req.params;
    // Prevenir auto-exclusão para não trancar o sistema
    if (req.user.id === id) {
        return res.status(400).json({ error: 'Não é possível excluir o próprio usuário' });
    }

    try {
        await db.query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ message: 'Usuário removido com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover usuário' });
    }
});

// 2. Criar Colaborador
app.post('/api/employees', authenticateToken, async (req, res) => {
    const { name, role, department, admissionDate, lastVacationEnd } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO employees (name, role, department, admission_date, last_vacation_end) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, role, department, admissionDate, lastVacationEnd || null]
        );
        const row = result.rows[0];
        const formatted = {
            id: row.id,
            name: row.name,
            role: row.role,
            department: row.department,
            admissionDate: row.admission_date ? new Date(row.admission_date).toISOString().split('T')[0] : null,
            lastVacationEnd: row.last_vacation_end ? new Date(row.last_vacation_end).toISOString().split('T')[0] : null
        };

        res.status(201).json(formatted);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao criar colaborador' });
    }
});

// 2.5 Editar Colaborador
app.put('/api/employees/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, role, department, admissionDate, lastVacationEnd } = req.body;
    try {
        const result = await db.query(
            `UPDATE employees 
             SET name = $1, role = $2, department = $3, admission_date = $4, last_vacation_end = $5, updated_at = CURRENT_TIMESTAMP
             WHERE id = $6
             RETURNING *`,
            [name, role, department, admissionDate, lastVacationEnd || null, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Colaborador não encontrado' });
        }

        const row = result.rows[0];
        const formatted = {
            id: row.id,
            name: row.name,
            role: row.role,
            department: row.department,
            admissionDate: row.admission_date ? new Date(row.admission_date).toISOString().split('T')[0] : null,
            lastVacationEnd: row.last_vacation_end ? new Date(row.last_vacation_end).toISOString().split('T')[0] : null
        };

        res.json(formatted);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar colaborador' });
    }
});

// 3. Remover Colaborador (Apenas Master)
app.delete('/api/employees/:id', authenticateToken, requireMaster, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM employees WHERE id = $1', [id]);
        res.json({ message: 'Colaborador removido com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover colaborador' });
    }
});

// --- API Endpoints Departamentos ---

// Listar Departamentos
app.get('/api/departments', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM departments ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao listar departamentos' });
    }
});

// Adicionar Departamento (Apenas Master)
app.post('/api/departments', authenticateToken, requireMaster, async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Nome do departamento é obrigatório' });

    try {
        const result = await db.query(
            'INSERT INTO departments (name) VALUES ($1) RETURNING *',
            [name]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        if (err.constraint === 'departments_name_key') {
            return res.status(400).json({ error: 'Departamento já existe' });
        }
        res.status(500).json({ error: 'Erro ao criar departamento' });
    }
});

// Remover Departamento (Apenas Master)
app.delete('/api/departments/:id', authenticateToken, requireMaster, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM departments WHERE id = $1', [id]);
        res.json({ message: 'Departamento removido com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover departamento' });
    }
});

// --- API Endpoints Férias ---

// Listar Férias
app.get('/api/vacations', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM vacations ORDER BY start_date ASC');
        const formatted = result.rows.map(row => ({
            id: row.id,
            employeeId: row.employee_id,
            startDate: row.start_date ? new Date(row.start_date).toISOString().split('T')[0] : null,
            durationDays: row.duration_days,
            status: row.status,
            hasAbono: row.has_abono,
            noticeSent: row.notice_sent,
            advance13th: row.advance_13th
        }));
        res.json(formatted);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar férias' });
    }
});

// Adicionar Férias
app.post('/api/vacations', authenticateToken, async (req, res) => {
    console.log('Recebendo requisição de férias:', req.body);
    const { employeeId, startDate, durationDays, status, hasAbono, advance13th } = req.body;

    // Validação básica
    if (!employeeId || !startDate || !durationDays) {
        console.error('Dados incompletos:', req.body);
        return res.status(400).json({ error: 'Dados incompletos (employeeId, startDate, durationDays)' });
    }

    try {
        const result = await db.query(
            `INSERT INTO vacations (employee_id, start_date, duration_days, status, has_abono, advance_13th) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [employeeId, startDate, parseInt(durationDays), status, Boolean(hasAbono), Boolean(advance13th)]
        );
        const row = result.rows[0];
        const formatted = {
            id: row.id,
            employeeId: row.employee_id,
            startDate: row.start_date ? new Date(row.start_date).toISOString().split('T')[0] : null,
            durationDays: row.duration_days,
            status: row.status,
            hasAbono: row.has_abono,
            noticeSent: row.notice_sent,
            advance13th: row.advance_13th
        };
        console.log('Férias salvas com sucesso:', formatted);
        res.status(201).json(formatted);
    } catch (err) {
        console.error('Erro ao inserir férias no banco:', err);
        res.status(500).json({ error: 'Erro ao agendar férias', details: err.message });
    }
});

// Atualizar Férias
app.put('/api/vacations/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { startDate, durationDays, status, hasAbono, noticeSent, advance13th } = req.body;
    try {
        const result = await db.query(
            `UPDATE vacations 
             SET start_date = $1, duration_days = $2, status = $3, has_abono = $4, notice_sent = $5, advance_13th = $6
             WHERE id = $7 
             RETURNING *`,
            [startDate, durationDays, status, hasAbono || false, noticeSent || false, advance13th || false, id]
        );
        const row = result.rows[0];
        const formatted = {
            id: row.id,
            employeeId: row.employee_id,
            startDate: row.start_date ? new Date(row.start_date).toISOString().split('T')[0] : null,
            durationDays: row.duration_days,
            status: row.status,
            hasAbono: row.has_abono,
            noticeSent: row.notice_sent,
            advance13th: row.advance_13th
        };
        res.json(formatted);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar férias' });
    }
});

// Remover Férias (Apenas Master)
app.delete('/api/vacations/:id', authenticateToken, requireMaster, async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM vacations WHERE id = $1', [id]);
        res.json({ message: 'Férias removidas com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover férias' });
    }
});

// Redirecionar qualquer outra rota para o React (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

// Testar conexão e rodar migrações
db.pool.connect(async (err, client, release) => {
    if (err) {
        return console.error('Erro ao conectar no banco de dados:', err.stack);
    }
    console.log('Conectado ao Banco de Dados PostgreSQL com sucesso!');
    await runMigrations();
    release();
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
