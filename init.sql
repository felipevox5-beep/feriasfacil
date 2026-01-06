-- Criação do Banco de Dados para o App Férias Fácil

-- Habilitar extensão para UUIDs se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de Colaboradores (Employees)
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL DEFAULT 'Geral',
    admission_date DATE NOT NULL,
    last_vacation_end DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Férias (Vacations)
CREATE TABLE IF NOT EXISTS vacations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    duration_days INTEGER NOT NULL CHECK (duration_days > 0),
    status VARCHAR(50) NOT NULL CHECK (status IN ('scheduled', 'active', 'completed')),
    has_abono BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_vacations_employee_id ON vacations(employee_id);
CREATE INDEX IF NOT EXISTS idx_vacations_status ON vacations(status);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);

-- Comentários
COMMENT ON TABLE employees IS 'Armazena os dados dos colaboradores e datas de admissão';
COMMENT ON TABLE vacations IS 'Armazena o histórico e agendamento de férias dos colaboradores';
