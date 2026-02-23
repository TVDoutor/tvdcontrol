-- TVDControl MySQL schema (UUID)
-- MySQL 8+ / InnoDB / utf8mb4

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(80) NOT NULL,
  department VARCHAR(80) NOT NULL,
  avatar TEXT NULL,
  refresh_token_hash VARCHAR(255) NULL,
  refresh_token_expires_at DATETIME NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  phone VARCHAR(30) NULL,
  cpf VARCHAR(14) NULL,
  internal_notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS categories (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS inventory_items (
  id CHAR(36) PRIMARY KEY,
  category VARCHAR(80) NOT NULL,
  type VARCHAR(40) NOT NULL,
  manufacturer VARCHAR(80) NOT NULL,
  name VARCHAR(160) NULL,
  model VARCHAR(160) NOT NULL,
  serial_number VARCHAR(120) NOT NULL,
  asset_tag VARCHAR(120) NULL,
  sku VARCHAR(120) NULL,
  icon VARCHAR(60) NULL,
  status ENUM('available','in_use','maintenance','retired') NOT NULL DEFAULT 'available',
  assigned_to_user_id CHAR(36) NULL,
  purchase_date DATE NOT NULL,
  purchase_price DECIMAL(12,2) NULL,
  warranty_end DATE NOT NULL,
  location VARCHAR(160) NULL,
  specs TEXT NULL,
  notes TEXT NULL,
  photo_main TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_items_assigned_user FOREIGN KEY (assigned_to_user_id) REFERENCES users(id),
  UNIQUE KEY uq_items_serial (serial_number),
  UNIQUE KEY uq_items_asset_tag (asset_tag),
  INDEX idx_items_status (status),
  INDEX idx_items_category (category),
  INDEX idx_items_assigned (assigned_to_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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

CREATE TABLE IF NOT EXISTS inventory_history (
  id CHAR(36) PRIMARY KEY,
  item_id CHAR(36) NOT NULL,
  actor_user_id CHAR(36) NULL,
  event_type VARCHAR(40) NOT NULL,
  color ENUM('primary','slate','success','danger') NULL,
  title VARCHAR(160) NOT NULL,
  description TEXT NULL,
  return_photo TEXT NULL,
  return_notes TEXT NULL,
  return_items TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_hist_item FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_hist_actor FOREIGN KEY (actor_user_id) REFERENCES users(id),
  INDEX idx_hist_item_created (item_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


