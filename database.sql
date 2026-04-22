CREATE DATABASE IF NOT EXISTS ponto_db;
USE ponto_db;

CREATE TABLE IF NOT EXISTS funcionarios (
  id VARCHAR(50) PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  cargo VARCHAR(30) NOT NULL DEFAULT 'funcionario'
);

CREATE TABLE IF NOT EXISTS registros (
  id VARCHAR(50) PRIMARY KEY,
  funcionario_id VARCHAR(50) NOT NULL,
  funcionario_nome VARCHAR(120) NOT NULL,
  tipo ENUM('ENTRADA', 'SAIDA') NOT NULL,
  data_hora DATETIME NOT NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  CONSTRAINT fk_registros_funcionario FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id)
);

-- Password: 123456
INSERT INTO funcionarios (id, nome, email, password_hash, cargo) VALUES
('FUNC001', 'João Silva', 'joao@empresa.com', '$2a$10$x5G8TICMYfYaEB3HUyhlM.6/abCC7zeZ3.3qpoFYE8FEO.e4nhheS', 'funcionario'),
('ADMIN001', 'Administrador', 'admin@empresa.com', '$2a$10$x5G8TICMYfYaEB3HUyhlM.6/abCC7zeZ3.3qpoFYE8FEO.e4nhheS', 'admin')
ON DUPLICATE KEY UPDATE nome = VALUES(nome), cargo = VALUES(cargo);
