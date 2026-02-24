-- Segunda foto para entrada (cadastro/edição) e devolução
ALTER TABLE inventory_items ADD COLUMN photo_main_2 TEXT NULL AFTER photo_main;
ALTER TABLE inventory_history ADD COLUMN return_photo_2 TEXT NULL AFTER return_photo;
