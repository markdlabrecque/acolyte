import { DatabaseSync } from 'node:sqlite';
import type { Config } from '../config.ts';

export interface Reservations {
  reserve(id: string, microUsd: number): void;
  settle(id: string, microUsd: number): void;
  close(): void;
}

export function spendingLedger(path: string, config: Config): Reservations {
  const db = new DatabaseSync(path, { timeout: 5000 });
  try {
    db.exec('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL');
    if (db.prepare('PRAGMA synchronous').get()?.synchronous !== 2) throw new Error('Ledger FULL required');
    db.exec('CREATE TABLE IF NOT EXISTS reservations (id TEXT PRIMARY KEY, month TEXT NOT NULL, micro_usd INTEGER NOT NULL, settled INTEGER NOT NULL DEFAULT 0, reserved_micro_usd INTEGER)');
    // Preserve old ledgers. A legacy settled row is never dispatchable again.
    if (!db.prepare('PRAGMA table_info(reservations)').all().some(column => column.name === 'reserved_micro_usd')) {
      db.exec('ALTER TABLE reservations ADD COLUMN reserved_micro_usd INTEGER');
    }
    db.exec('UPDATE reservations SET reserved_micro_usd=micro_usd WHERE reserved_micro_usd IS NULL');
  } catch (error) { db.close(); throw error; }
  const month = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Vancouver', year: 'numeric', month: '2-digit' }).format(new Date());
  return {
    reserve(id, amount) {
      if (!Number.isSafeInteger(amount) || amount < 0) throw new Error('Invalid reservation');
      db.exec('BEGIN IMMEDIATE');
      try {
        const prior = db.prepare('SELECT reserved_micro_usd, settled FROM reservations WHERE id=?').get(id);
        if (prior) {
          if (prior.settled !== 0 || prior.reserved_micro_usd !== amount) throw new Error('Reservation identity conflict');
          db.exec('COMMIT');
          return;
        }
        const key = month();
        const spent = Number(db.prepare('SELECT COALESCE(SUM(micro_usd),0) AS spent FROM reservations WHERE month=?').get(key)?.spent);
        if (spent + amount > Math.floor(config.limits.monthlyUsd * 1e6)) throw new Error('Shared spending limit exhausted');
        db.prepare('INSERT INTO reservations (id,month,micro_usd,reserved_micro_usd) VALUES (?,?,?,?)').run(id, key, amount, amount);
        db.exec('COMMIT');
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    },
    settle(id, amount) {
      if (!Number.isSafeInteger(amount) || amount < 0) throw new Error('Invalid usage');
      db.exec('BEGIN IMMEDIATE');
      try {
        const row = db.prepare('SELECT micro_usd, settled FROM reservations WHERE id=?').get(id);
        if (!row || (row.settled === 1 && row.micro_usd !== amount)) throw new Error('Usage identity conflict');
        db.prepare('UPDATE reservations SET micro_usd=?, settled=1 WHERE id=? AND settled=0').run(amount, id);
        db.exec('COMMIT');
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    },
    close() { db.close(); },
  };
}
