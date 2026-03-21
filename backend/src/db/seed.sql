-- Seed Data for PowerPilot PoC

INSERT INTO users (name, email, meter_id) VALUES
  ('Arsh Demo',   'arsh@powerpilot.io',   'MTR-001'),
  ('Priya Sharma','priya@powerpilot.io',   'MTR-002'),
  ('Aman Gupta',  'aman@powerpilot.io',    'MTR-003');

INSERT INTO appliances (user_id, name, type, wattage, is_on) VALUES
  (1, 'Lamp',   'lighting', 40,   TRUE),
  (1, 'Fan',    'cooling',  75,   TRUE),
  (1, 'Heater', 'heating',  2000, FALSE);

INSERT INTO tariffs (name, rate_per_unit, start_hour, end_hour) VALUES
  ('Peak',     8.00, 14, 20),
  ('Off-Peak', 4.00, 20, 14);

INSERT INTO schedules (appliance_id, start_hour, end_hour, is_auto) VALUES
  (3, 20, 6, TRUE);  -- Heater runs only during off-peak

INSERT INTO notifications (user_id, title, message, type) VALUES
  (1, 'High Usage Alert',     'Your consumption exceeded 5 kWh today.',         'warning'),
  (1, 'Tariff Change',        'Peak tariff starts at 2:00 PM today.',           'info'),
  (1, 'Optimizer Tip',        'Schedule your Heater to off-peak hours to save ₹120/month.', 'tip');
