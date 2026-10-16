-- Kaptajn Tal – databaseskema (D1 / SQLite). Kør: pnpm db:init (idempotent).

-- En familie er den egentlige enhed. Familiekoder er én måde at nå den på;
-- senere kan e-mail-login og betaling pege på samme familie.
CREATE TABLE IF NOT EXISTS familier (
  id TEXT PRIMARY KEY,
  oprettet INTEGER NOT NULL,
  plan TEXT NOT NULL DEFAULT 'gratis'      -- 'gratis' | 'betalt' (senere)
);

CREATE TABLE IF NOT EXISTS koder (
  kode TEXT PRIMARY KEY,
  familie_id TEXT NOT NULL,
  oprettet INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS koder_familie ON koder (familie_id);

-- Barnets fremgang (én række pr. familie).
CREATE TABLE IF NOT EXISTS progress (
  familie_id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Historik: øjebliksbilleder, så en overskrivning kan fortrydes.
CREATE TABLE IF NOT EXISTS progress_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  familie_id TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  saved_at INTEGER NOT NULL,
  fp TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS progress_history_familie ON progress_history (familie_id, id);

-- Familiens egne togter. slettet = 1 er en "gravsten", så sletning synker til andre enheder.
CREATE TABLE IF NOT EXISTS togter (
  familie_id TEXT NOT NULL,
  togt_id TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  slettet INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (familie_id, togt_id)
);

-- Forbrug af AI pr. scanning (bruges fra fase 2: vis forbrug, senere loft for betalt plan).
CREATE TABLE IF NOT EXISTS forbrug (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  familie_id TEXT NOT NULL,
  tid INTEGER NOT NULL,
  noeglekilde TEXT NOT NULL,               -- 'egen' | 'vores'
  udbyder TEXT NOT NULL,                   -- 'anthropic' | 'openai' | 'openrouter'
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  pris_usd REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS forbrug_familie ON forbrug (familie_id, tid);

-- Gendannelseskode: kun en SHA-256 af koden gemmes. Bruges til at finde familiekoden igen.
CREATE TABLE IF NOT EXISTS gendannelse (
  familie_id TEXT PRIMARY KEY,
  hash TEXT NOT NULL UNIQUE,
  oprettet INTEGER NOT NULL
);
