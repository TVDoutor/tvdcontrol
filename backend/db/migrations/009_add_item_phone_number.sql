-- Campo de número de telefone para itens Celulares > Smartphone (ex: 11 98346-3999)
ALTER TABLE inventory_items
ADD COLUMN phone_number VARCHAR(20) NULL DEFAULT NULL
AFTER notes;
