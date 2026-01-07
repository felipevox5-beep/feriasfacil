import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 80;

// Middlewares
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do React (após build)
app.use(express.static(path.join(__dirname, '../dist')));

// --- API Endpoint IA ---
app.post('/api/chat', async (req, res) => {
    const { prompt, context } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt é obrigatório' });
    }

    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Servidor não configurado com chave API' });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : "";
        const genAI = new GoogleGenerativeAI(apiKey);
        // Using specific version to avoid alias issues
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

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

// 1. Listar Colaboradores
app.get('/api/employees', async (req, res) => {
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

// 2. Adicionar Colaborador
app.post('/api/employees', async (req, res) => {
    const { name, role, department, admissionDate, lastVacationEnd } = req.body;

    if (!name || !role || !admissionDate) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    try {
        const result = await db.query(
            `INSERT INTO employees (name, role, department, admission_date, last_vacation_end) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
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

// 3. Remover Colaborador
app.delete('/api/employees/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM employees WHERE id = $1', [id]);
        res.json({ message: 'Colaborador removido com sucesso' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover colaborador' });
    }
});

// Redirecionar qualquer outra rota para o React (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
