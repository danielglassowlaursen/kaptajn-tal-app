CREATE TABLE IF NOT EXISTS progress (
  code TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Historik: øjebliksbilleder pr. kode, så en overskrivning kan fortrydes.
CREATE TABLE IF NOT EXISTS progress_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  saved_at INTEGER NOT NULL,
  fp TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS progress_history_code ON progress_history (code, id);
