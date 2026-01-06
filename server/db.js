import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Configura a conexão com o banco de dados usando a variável de ambiente
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Testar conexão
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Erro ao conectar no banco de dados:', err.stack);
    }
    console.log('Conectado ao Banco de Dados PostgreSQL com sucesso!');
    release();
});

export default {
    query: (text, params) => pool.query(text, params),
    pool
};
