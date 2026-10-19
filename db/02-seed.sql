-- HuellitasVet - Datos de prueba
-- Las fechas se generan relativas a la fecha de carga para que siempre haya citas futuras.

CREATE OR REPLACE FUNCTION calcular_dv(cuerpo INTEGER) RETURNS TEXT AS $$
DECLARE
  suma INTEGER := 0;
  multiplo INTEGER := 2;
  resto INTEGER;
  n INTEGER := cuerpo;
BEGIN
  WHILE n > 0 LOOP
    suma := suma + (n % 10) * multiplo;
    n := n / 10;
    multiplo := CASE WHEN multiplo = 7 THEN 2 ELSE multiplo + 1 END;
  END LOOP;
  resto := 11 - (suma % 11);
  RETURN CASE resto WHEN 11 THEN '0' WHEN 10 THEN 'K' ELSE resto::TEXT END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Personal de la clínica (contraseñas documentadas en README)
INSERT INTO usuarios (rut, nombre, email, telefono, password_hash, rol, especialidad) VALUES
  ('11111111-1', 'Administrador Sistema', 'admin@huellitas.cl',      '+56911111111', md5('Admin123!'), 'admin', NULL),
  ('12345678-5', 'Dra. Camila Rojas',     'camila.rojas@huellitas.cl', '+56922222222', md5('Vet12345!'), 'veterinario', 'Medicina general'),
  ('13456789-' || calcular_dv(13456789), 'Dr. Ignacio Fuentes',   'ignacio.fuentes@huellitas.cl', '+56933333333', md5('Vet12345!'), 'veterinario', 'Cirugía'),
  ('14567890-' || calcular_dv(14567890), 'Dra. Valentina Soto',   'valentina.soto@huellitas.cl', '+56944444444', md5('Vet12345!'), 'veterinario', 'Exóticos'),
  ('15678901-' || calcular_dv(15678901), 'Pedro Muñoz',           'recepcion@huellitas.cl',  '+56955555555', md5('Recep123!'), 'recepcionista', NULL);

-- Clientes conocidos
INSERT INTO usuarios (rut, nombre, email, telefono, direccion, password_hash, rol) VALUES
  ('16789012-' || calcular_dv(16789012), 'María González', 'maria.gonzalez@correo.cl', '+56966666666', 'Av. Providencia 1234, Santiago', md5('Cliente123!'), 'cliente'),
  ('17890123-' || calcular_dv(17890123), 'Juan Pérez',     'juan.perez@correo.cl',     '+56977777777', 'Los Aromos 567, Maipú',          md5('Cliente123!'), 'cliente');

-- Clientes generados
INSERT INTO usuarios (rut, nombre, email, telefono, direccion, password_hash, rol, creado_en)
SELECT
  (10000000 + g * 7919) || '-' || calcular_dv(10000000 + g * 7919),
  (ARRAY['Ana','Benjamín','Catalina','Diego','Elena','Felipe','Gabriela','Héctor','Isidora','Javier','Josefa','Lucas','Martina','Nicolás','Olivia','Pablo','Renata','Sebastián','Tomás','Antonia'])[1 + g % 20]
    || ' ' ||
  (ARRAY['Silva','Contreras','Rojas','Díaz','Morales','López','Vargas','Castro','Herrera','Reyes','Torres','Araya','Espinoza','Valenzuela','Sepúlveda','Carrasco','Gutiérrez','Pizarro'])[1 + (g * 7) % 18],
  'cliente' || g || '@correo.cl',
  '+569' || (60000000 + g * 13),
  'Calle ' || g || ', Santiago',
  md5('Cliente123!'),
  'cliente',
  NOW() - (g || ' hours')::INTERVAL
FROM generate_series(1, 300) AS g;

-- Mascotas de los clientes conocidos
INSERT INTO mascotas (tutor_id, nombre, especie, raza, sexo, fecha_nacimiento, peso_kg, microchip, observaciones) VALUES
  (6, 'Luna',    'Perro', 'Labrador',        'H', CURRENT_DATE - INTERVAL '4 years',  28.5, '985112000123456', 'Alérgica al pollo.'),
  (6, 'Michi',   'Gato',  'Doméstico pelo corto', 'M', CURRENT_DATE - INTERVAL '10 years', 4.2, NULL, 'Gato senior, control renal semestral.'),
  (7, 'Rocky',   'Perro', 'Quiltro',         'M', CURRENT_DATE - INTERVAL '7 years',  15.0, '985112000654321', NULL),
  (7, 'Kiwi',    'Ave',   'Cacatúa ninfa',   'H', CURRENT_DATE - INTERVAL '2 years',  0.09, NULL, 'Atender con Dra. Soto (exóticos).');

-- Mascotas generadas
INSERT INTO mascotas (tutor_id, nombre, especie, raza, sexo, fecha_nacimiento, peso_kg)
SELECT
  8 + (g % 300),
  (ARRAY['Toby','Max','Bella','Coco','Simba','Nala','Chispa','Bruno','Lola','Manchas','Pelusa','Canela','Firulais','Kira','Thor','Mia'])[1 + g % 16],
  (ARRAY['Perro','Perro','Perro','Gato','Gato','Conejo'])[1 + g % 6],
  (ARRAY['Quiltro','Poodle','Golden Retriever','Siamés','Persa','Holland Lop'])[1 + g % 6],
  (ARRAY['M','H'])[1 + g % 2],
  CURRENT_DATE - ((180 + (g * 37) % 5000) || ' days')::INTERVAL,
  ROUND((2 + (g * 13) % 35)::NUMERIC, 2)
FROM generate_series(1, 450) AS g;

INSERT INTO servicios (nombre, descripcion, precio, duracion_min) VALUES
  ('Consulta general',        'Evaluación clínica general.',                     18000, 30),
  ('Vacunación',              'Aplicación de vacuna (no incluye el biológico).', 12000, 15),
  ('Control post operatorio', 'Revisión de herida y evolución.',                 10000, 20),
  ('Desparasitación',         'Desparasitación interna y externa.',               9000, 15),
  ('Esterilización',          'Cirugía de esterilización.',                     85000, 120),
  ('Limpieza dental',         'Destartraje bajo sedación.',                     65000, 90),
  ('Consulta exóticos',       'Atención de aves, reptiles y pequeños mamíferos.', 25000, 45),
  ('Urgencia',                'Atención de urgencia sin hora.',                  35000, 60);

-- Citas históricas (último año) y futuras (próximos 30 días)
INSERT INTO citas (mascota_id, veterinario_id, servicio_id, fecha_hora, estado, motivo, creado_por, creado_en)
SELECT
  1 + (g % 454),
  2 + (g % 3),
  1 + (g % 8),
  date_trunc('day', NOW()) - ((365 - (g % 395)) || ' days')::INTERVAL + ((9 + (g % 9)) || ' hours')::INTERVAL,
  CASE
    WHEN (365 - (g % 395)) > 0 THEN (CASE WHEN g % 10 = 0 THEN 'cancelada' ELSE 'atendida' END)
    ELSE (CASE WHEN g % 3 = 0 THEN 'confirmada' ELSE 'agendada' END)
  END,
  (ARRAY['Control anual','Vómitos','Cojera','Picazón','Vacuna anual','Decaimiento','Revisión dental','Diarrea'])[1 + g % 8],
  5,
  NOW() - INTERVAL '400 days'
FROM generate_series(1, 6000) AS g;

INSERT INTO atenciones (cita_id, mascota_id, veterinario_id, fecha, peso_kg, temperatura, anamnesis, diagnostico, tratamiento)
SELECT c.id, c.mascota_id, c.veterinario_id, c.fecha_hora,
       m.peso_kg, 38.0 + (c.id % 15) / 10.0,
       'Tutor relata: ' || c.motivo,
       (ARRAY['Sano','Gastroenteritis leve','Dermatitis alérgica','Otitis externa','Sobrepeso','Enfermedad periodontal'])[1 + c.id % 6],
       (ARRAY['Sin tratamiento','Dieta blanda 3 días','Antihistamínico 7 días','Gotas óticas 10 días','Plan de alimentación','Destartraje programado'])[1 + c.id % 6]
FROM citas c JOIN mascotas m ON m.id = c.mascota_id
WHERE c.estado = 'atendida';

INSERT INTO vacunas (mascota_id, nombre, lote, fecha_aplicacion, proxima_dosis, aplicada_por)
SELECT 1 + (g % 454),
       (ARRAY['Antirrábica','Óctuple','Triple felina','Leucemia felina'])[1 + g % 4],
       'L' || (2024000 + g),
       CURRENT_DATE - ((g * 3) % 360 || ' days')::INTERVAL,
       CURRENT_DATE - ((g * 3) % 360 || ' days')::INTERVAL + INTERVAL '1 year',
       2 + (g % 3)
FROM generate_series(1, 700) AS g;

INSERT INTO boletas (cita_id, subtotal, descuento, iva, total, metodo_pago, pagada, emitida_por, creado_en)
SELECT c.id, s.precio, 0, ROUND(s.precio * 0.19), s.precio + ROUND(s.precio * 0.19),
       (ARRAY['efectivo','debito','credito','transferencia'])[1 + c.id % 4], TRUE, 5, c.fecha_hora
FROM citas c JOIN servicios s ON s.id = c.servicio_id
WHERE c.estado = 'atendida';
