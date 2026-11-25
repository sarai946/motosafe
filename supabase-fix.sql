-- Agregar índice único en user_id para perfiles y motocicletas
ALTER TABLE perfiles ADD CONSTRAINT perfiles_user_id_unique UNIQUE (user_id);
ALTER TABLE motocicletas ADD CONSTRAINT motocicletas_user_id_unique UNIQUE (user_id);
