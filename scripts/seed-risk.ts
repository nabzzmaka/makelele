/**
 * Seed script for the Risikoscoring Dashboard.
 *
 * Usage:
 *   npx tsx scripts/seed-risk.ts
 *
 * Creates example partners and events so the dashboard shows real data.
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "isqm1.db");

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Ensure tables exist
db.exec(`
  CREATE TABLE IF NOT EXISTS partners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    partner_id TEXT NOT NULL UNIQUE,
    partner_name TEXT NOT NULL,
    profit_center TEXT NOT NULL,
    leader_level TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS risk_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    partner_id INTEGER NOT NULL,
    avvikshendelse TEXT NOT NULL,
    avvikskategori TEXT NOT NULL,
    poeng INTEGER NOT NULL DEFAULT 0,
    begrunnelse TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_by TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
  );
`);

// Clear existing seed data
db.exec("DELETE FROM risk_events");
db.exec("DELETE FROM partners");

const insertPartner = db.prepare(
  `INSERT INTO partners (partner_id, partner_name, profit_center, leader_level)
   VALUES (?, ?, ?, ?)`
);

const insertEvent = db.prepare(
  `INSERT INTO risk_events (partner_id, avvikshendelse, avvikskategori, poeng, begrunnelse, created_by)
   VALUES (?, ?, ?, ?, ?, ?)`
);

// ─── Partners ──────────────────────────────────────────────────────────────

const partners = [
  { pid: "P-001", name: "Erik Hansen", pc: "Øst CCH", level: "Partner" },
  { pid: "P-002", name: "Kari Johansen", pc: "Øst CCH", level: "Direktør" },
  { pid: "P-003", name: "Lars Olsen", pc: "Midt-Nord CCH", level: "Partner" },
  { pid: "P-004", name: "Anne Svendsen", pc: "Midt-Nord CCH", level: "Lønnspartner" },
  { pid: "P-005", name: "Magnus Berg", pc: "Vest CCH", level: "Partner" },
  { pid: "P-006", name: "Ingrid Haugen", pc: "Vest CCH", level: "Direktør" },
  { pid: "P-007", name: "Bjørn Dahl", pc: "Sør CCH", level: "Partner" },
  { pid: "P-008", name: "Silje Moe", pc: "Sør CCH", level: "Lønnspartner" },
  { pid: "P-009", name: "Thomas Lie", pc: "Øst CCH", level: "Partner" },
  { pid: "P-010", name: "Marte Vik", pc: "Midt-Nord CCH", level: "Direktør" },
];

const partnerIds: Record<string, number> = {};

for (const p of partners) {
  const result = insertPartner.run(p.pid, p.name, p.pc, p.level);
  partnerIds[p.pid] = Number(result.lastInsertRowid);
}

// ─── Events ────────────────────────────────────────────────────────────────

interface EventSeed {
  pid: string;
  hendelse: string;
  kategori: string;
  poeng: number;
  begrunnelse: string;
}

const events: EventSeed[] = [
  // Erik Hansen (P-001) — Score: 20 → Høy
  {
    pid: "P-001",
    hendelse: "Intern kvalitetskontroll",
    kategori: "Ikke godkjent",
    poeng: 20,
    begrunnelse: "Vesentlige mangler i dokumentasjon av revisjonsbevis",
  },

  // Kari Johansen (P-002) — Score: 0 → Lav
  {
    pid: "P-002",
    hendelse: "Intern kvalitetskontroll",
    kategori: "Godkjent",
    poeng: 0,
    begrunnelse: "Ingen avvik funnet",
  },

  // Lars Olsen (P-003) — Score: 10 → Medium
  {
    pid: "P-003",
    hendelse: "Resultater fra overvåkende kontroller",
    kategori: "Behov for betydelig forbedring",
    poeng: 10,
    begrunnelse: "Mangelfulle vurderinger av fortsatt drift",
  },

  // Anne Svendsen (P-004) — Score: 30 → Høy
  {
    pid: "P-004",
    hendelse: "Intern kvalitetskontroll",
    kategori: "Ikke godkjent",
    poeng: 20,
    begrunnelse: "Utilstrekkelig risikovurdering av vesentlig feilinformasjon",
  },
  {
    pid: "P-004",
    hendelse: "Obligatoriske kurs",
    kategori: "Behov for betydelig forbedring",
    poeng: 10,
    begrunnelse: "Ikke fullført obligatorisk kurs innen frist",
  },

  // Magnus Berg (P-005) — Score: 40 → Svært høy
  {
    pid: "P-005",
    hendelse: "Ekstern kvalitetskontroll, erstatningssaker, innrapportering, klager, o.l.",
    kategori: "Ikke godkjent",
    poeng: 20,
    begrunnelse: "Merknader fra ekstern kvalitetskontroll – vesentlige funn",
  },
  {
    pid: "P-005",
    hendelse: "Indikator for systematisk risiko (siste tre år)",
    kategori: "Ikke godkjent",
    poeng: 20,
    begrunnelse: "Gjentakende feil over tre kontrollperioder",
  },

  // Ingrid Haugen (P-006) — Score: 10 → Medium
  {
    pid: "P-006",
    hendelse: "Vurdering fra nærmeste leder (skal kvalitetssikres av regional tjenesteleder (normalt))",
    kategori: "Behov for betydelig forbedring",
    poeng: 10,
    begrunnelse: "Leder vurderer behov for tettere oppfølging",
  },

  // Bjørn Dahl (P-007) — Score: 0 → Lav
  {
    pid: "P-007",
    hendelse: "Intern kvalitetskontroll",
    kategori: "Godkjent",
    poeng: 0,
    begrunnelse: "Alt i orden",
  },
  {
    pid: "P-007",
    hendelse: "Etterutdanningskrav",
    kategori: "Godkjent",
    poeng: 0,
    begrunnelse: "Alle krav oppfylt",
  },

  // Silje Moe (P-008) — Score: 35 → Svært høy
  {
    pid: "P-008",
    hendelse: "Resultater fra temakontroller o.l. – på oppdragsnivå",
    kategori: "Ikke godkjent",
    poeng: 20,
    begrunnelse: "Mangelfull oppfølging av ISA 240 krav",
  },
  {
    pid: "P-008",
    hendelse: "Historikk fra tidligere interne kontroller og overvåkende kontroller (siste tre år)",
    kategori: "Behov for betydelig forbedring",
    poeng: 10,
    begrunnelse: "Tilbakevendende funn fra tidligere perioder",
  },
  {
    pid: "P-008",
    hendelse: "Skjønnsmessig vurdering av leder QRM og leder for revisjon",
    kategori: "Behov for betydelig forbedring",
    poeng: 5,
    begrunnelse: "Ledervurdering: behov for ekstra opplæring (manuelt justert poeng)",
  },

  // Thomas Lie (P-009) — Score: 10 → Medium
  {
    pid: "P-009",
    hendelse: "Tidligere forbedringstiltak",
    kategori: "Behov for betydelig forbedring",
    poeng: 10,
    begrunnelse: "Forbedringstiltak fra forrige år ikke fullt implementert",
  },

  // Marte Vik (P-010) — Score: 0 → Lav
  {
    pid: "P-010",
    hendelse: "Intern kvalitetskontroll",
    kategori: "Godkjent",
    poeng: 0,
    begrunnelse: "Gjennomgang viste god kvalitet",
  },
];

for (const e of events) {
  insertEvent.run(
    partnerIds[e.pid],
    e.hendelse,
    e.kategori,
    e.poeng,
    e.begrunnelse,
    "seed-script"
  );
}

console.log("Seed complete!");
console.log(`  ${partners.length} partners created`);
console.log(`  ${events.length} risk events created`);
console.log("");
console.log("Score summary:");

for (const p of partners) {
  const pEvents = events.filter((e) => e.pid === p.pid);
  const score = pEvents.reduce((s, e) => s + e.poeng, 0);
  const profile =
    score < 10 ? "Lav" : score < 20 ? "Medium" : score < 35 ? "Høy" : "Svært høy";
  console.log(`  ${p.name.padEnd(20)} Score: ${String(score).padStart(3)}  → ${profile}`);
}

db.close();
