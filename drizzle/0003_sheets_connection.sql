INSERT INTO survey_settings (id, version, endpoint, ready)
VALUES (
  1,
  '2026-09-10',
  'https://script.google.com/macros/s/AKfycbzRi-LZcXlrzGYtUaSzfOvYNwbSDku7kphfKX7smZXotDkEUhv_yFaB4v5NwaGfsqt-/exec',
  1
)
ON CONFLICT(id) DO UPDATE SET
  endpoint = excluded.endpoint,
  ready = excluded.ready;