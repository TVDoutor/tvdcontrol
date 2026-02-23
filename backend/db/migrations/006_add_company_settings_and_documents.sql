-- Migration 006: tabelas para Termo de Responsabilidade (PDF recebimento/devolução)
-- company_settings: dados da empresa para os documentos
-- inventory_documents: registro dos PDFs gerados

CREATE TABLE IF NOT EXISTS company_settings (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  legal_name VARCHAR(255) NULL,
  address VARCHAR(255) NULL,
  city VARCHAR(120) NULL,
  state VARCHAR(60) NULL,
  zip VARCHAR(20) NULL,
  cnpj VARCHAR(20) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS inventory_documents (
  id CHAR(36) PRIMARY KEY,
  item_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  type ENUM('recebimento','devolucao') NOT NULL,
  file_path VARCHAR(512) NOT NULL,
  signed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actor_user_id CHAR(36) NULL,
  history_event_id CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_doc_item FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_doc_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_doc_actor FOREIGN KEY (actor_user_id) REFERENCES users(id),
  INDEX idx_doc_item (item_id),
  INDEX idx_doc_user (user_id),
  INDEX idx_doc_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
