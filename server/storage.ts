import fs from 'fs';
import path from 'path';
import { 
  Family, 
  FamilyOccasion, 
  Member, 
  Person, 
  LineageMember 
} from '../src/types';
import { UserProfile } from '../src/services/firebase';
import type { PushDeviceRecord } from './pushMessaging';

export interface DatabaseSchema {
  meta: {
    driver: string;
    version: number;
    createdAt: string;
    lastSavedAt: string;
    persistenceFile: string;
    recordsCount: {
      occasions: number;
      members: number;
      people: number;
      lineageMembers: number;
      users: number;
    };
  };
  family: Family;
  occasions: FamilyOccasion[];
  members: Member[];
  people: Person[];
  lineageMembers: LineageMember[];
  users: Record<string, UserProfile>;
  pushDevices: PushDeviceRecord[];
  /** Keys like memberId:occasionId:d7 to avoid duplicate reminder sends */
  reminderDispatchLog?: string[];
  auditLogs: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    timestamp: string;
    details?: string;
  }>;
}

// Locate or establish data directory in project root
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'kulloop_store.json');

function buildInitialDatabase(): DatabaseSchema {
  const now = new Date().toISOString();
  return {
    meta: {
      driver: 'file-json-persistent-engine',
      version: 1,
      createdAt: now,
      lastSavedAt: now,
      persistenceFile: DB_FILE,
      recordsCount: {
        occasions: 0,
        members: 0,
        people: 0,
        lineageMembers: 0,
        users: 0,
      },
    },
    family: {
      id: 'fam_default',
      name: 'My Family Lineage',
      homeLocation: 'Pune, Maharashtra',
      secondLocation: '',
      region: 'Maharashtra',
      convention: 'Amanta',
      validationSource: 'Datar Panchang (Amanta) — verified by family pandit',
      plan: 'pilot_founding',
      payer: 'configurator',
      configuratorName: 'Family Configurator',
      configuratorPhone: '',
      traditionNotes: 'Amanta tradition calendar. Computed for local sunrise.',
      consultedEntity: 'An elder',
    },
    occasions: [],
    members: [],
    people: [],
    lineageMembers: [],
    users: {},
    pushDevices: [],
    reminderDispatchLog: [],
    auditLogs: [
      {
        id: `log_init_${Date.now()}`,
        action: 'DATABASE_INITIALIZED',
        entityType: 'SYSTEM',
        entityId: 'kulloop_store',
        timestamp: now,
        details: 'Initial database created with clean slate for new family on-boarding',
      },
    ],
  };
}

class StorageEngine {
  private cache: DatabaseSchema | null = null;

  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (err) {
        console.error('Failed to create data directory:', err);
      }
    }

    if (!fs.existsSync(DB_FILE)) {
      console.log(`[StorageEngine] Initializing persistent database at: ${DB_FILE}`);
      const initial = buildInitialDatabase();
      this.writeToDisk(initial);
      this.cache = initial;
    } else {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.cache = JSON.parse(raw);
        if (!this.cache!.pushDevices) {
          this.cache!.pushDevices = [];
        }
        if (!this.cache!.reminderDispatchLog) {
          this.cache!.reminderDispatchLog = [];
        }
        console.log(`[StorageEngine] Loaded database from: ${DB_FILE} (${this.cache?.occasions?.length || 0} occasions, ${this.cache?.members?.length || 0} members)`);
      } catch (err) {
        console.error(`[StorageEngine] Error reading database file, creating fresh initial store:`, err);
        const initial = buildInitialDatabase();
        this.writeToDisk(initial);
        this.cache = initial;
      }
    }
  }

  private writeToDisk(data: DatabaseSchema): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    data.meta.lastSavedAt = new Date().toISOString();
    data.meta.recordsCount = {
      occasions: data.occasions?.length || 0,
      members: data.members?.length || 0,
      people: data.people?.length || 0,
      lineageMembers: data.lineageMembers?.length || 0,
      users: Object.keys(data.users || {}).length,
    };

    const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
    const serialized = JSON.stringify(data, null, 2);
    fs.writeFileSync(tempFile, serialized, 'utf8');
    fs.renameSync(tempFile, DB_FILE);
  }

  public getData(): DatabaseSchema {
    if (!this.cache) {
      this.ensureInitialized();
    }
    if (!this.cache!.pushDevices) {
      this.cache!.pushDevices = [];
    }
    if (!this.cache!.reminderDispatchLog) {
      this.cache!.reminderDispatchLog = [];
    }
    return this.cache!;
  }

  public save(updater: (draft: DatabaseSchema) => void, actionName = 'UPDATE', entityType = 'UNKNOWN', entityId = '0'): DatabaseSchema {
    const current = this.getData();
    updater(current);

    current.auditLogs.unshift({
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      action: actionName,
      entityType,
      entityId,
      timestamp: new Date().toISOString(),
    });

    if (current.auditLogs.length > 200) {
      current.auditLogs = current.auditLogs.slice(0, 200);
    }

    this.writeToDisk(current);
    this.cache = current;
    return current;
  }

  public resetToDefaults(): DatabaseSchema {
    console.log(`[StorageEngine] Resetting database file to pristine defaults`);
    const initial = buildInitialDatabase();
    this.writeToDisk(initial);
    this.cache = initial;
    return initial;
  }

  public getDatabasePath(): string {
    return DB_FILE;
  }

  public generateSqliteDump(): string {
    const data = this.getData();
    const escapeSql = (str: any) => {
      if (str === null || str === undefined) return 'NULL';
      return `'${String(str).replace(/'/g, "''")}'`;
    };

    let sql = `-- ==================================================================\n`;
    sql += `-- KulLoop Family Rituals & Heritage Database (SQLite Schema & DML)\n`;
    sql += `-- Generated on: ${new Date().toISOString()}\n`;
    sql += `-- Storage Engine: backend-file-json-persistence\n`;
    sql += `-- ==================================================================\n\n`;

    sql += `PRAGMA foreign_keys = ON;\n\n`;

    // Families Table
    sql += `-- Table: families\n`;
    sql += `CREATE TABLE IF NOT EXISTS families (\n`;
    sql += `  id TEXT PRIMARY KEY,\n`;
    sql += `  name TEXT NOT NULL,\n`;
    sql += `  home_location TEXT NOT NULL,\n`;
    sql += `  second_location TEXT,\n`;
    sql += `  region TEXT,\n`;
    sql += `  convention TEXT,\n`;
    sql += `  validation_source TEXT,\n`;
    sql += `  plan TEXT,\n`;
    sql += `  payer TEXT,\n`;
    sql += `  configurator_name TEXT,\n`;
    sql += `  configurator_phone TEXT,\n`;
    sql += `  tradition_notes TEXT,\n`;
    sql += `  consulted_entity TEXT\n`;
    sql += `);\n\n`;

    const fam = data.family;
    sql += `INSERT OR REPLACE INTO families (id, name, home_location, second_location, region, convention, validation_source, plan, payer, configurator_name, configurator_phone, tradition_notes, consulted_entity)\n`;
    sql += `VALUES (${escapeSql(fam.id)}, ${escapeSql(fam.name)}, ${escapeSql(fam.homeLocation)}, ${escapeSql(fam.secondLocation)}, ${escapeSql(fam.region)}, ${escapeSql(fam.convention)}, ${escapeSql(fam.validationSource)}, ${escapeSql(fam.plan)}, ${escapeSql(fam.payer)}, ${escapeSql(fam.configuratorName)}, ${escapeSql(fam.configuratorPhone)}, ${escapeSql(fam.traditionNotes)}, ${escapeSql(fam.consultedEntity)});\n\n`;

    // Members Table
    sql += `-- Table: members\n`;
    sql += `CREATE TABLE IF NOT EXISTS members (\n`;
    sql += `  id TEXT PRIMARY KEY,\n`;
    sql += `  family_id TEXT NOT NULL REFERENCES families(id),\n`;
    sql += `  name TEXT NOT NULL,\n`;
    sql += `  relationship TEXT,\n`;
    sql += `  phone TEXT,\n`;
    sql += `  email TEXT,\n`;
    sql += `  language TEXT,\n`;
    sql += `  country TEXT,\n`;
    sql += `  city TEXT,\n`;
    sql += `  time_zone TEXT,\n`;
    sql += `  opt_ins TEXT,\n`;
    sql += `  lead_time TEXT,\n`;
    sql += `  frequency_cap_per_week INTEGER,\n`;
    sql += `  status TEXT,\n`;
    sql += `  reminder_preferences TEXT\n`;
    sql += `);\n\n`;

    for (const m of data.members) {
      sql += `INSERT OR REPLACE INTO members (id, family_id, name, relationship, phone, email, language, country, city, time_zone, opt_ins, lead_time, frequency_cap_per_week, status, reminder_preferences)\n`;
      sql += `VALUES (${escapeSql(m.id)}, ${escapeSql(m.familyId)}, ${escapeSql(m.name)}, ${escapeSql(m.relationship)}, ${escapeSql(m.phone)}, ${escapeSql(m.email)}, ${escapeSql(m.language)}, ${escapeSql(m.country)}, ${escapeSql(m.city)}, ${escapeSql(m.timeZone)}, ${escapeSql(JSON.stringify(m.optIns))}, ${escapeSql(m.leadTime)}, ${m.frequencyCapPerWeek || 2}, ${escapeSql(m.status)}, ${escapeSql(JSON.stringify(m.reminderPreferences || {}))});\n`;
    }
    sql += `\n`;

    // Occasions Table
    sql += `-- Table: occasions\n`;
    sql += `CREATE TABLE IF NOT EXISTS occasions (\n`;
    sql += `  id TEXT PRIMARY KEY,\n`;
    sql += `  family_id TEXT NOT NULL REFERENCES families(id),\n`;
    sql += `  title TEXT NOT NULL,\n`;
    sql += `  occasion_type TEXT NOT NULL,\n`;
    sql += `  recurrence_type TEXT NOT NULL,\n`;
    sql += `  person_name_display TEXT,\n`;
    sql += `  relationship_display TEXT,\n`;
    sql += `  tithi_fields TEXT,\n`;
    sql += `  gregorian_fields TEXT,\n`;
    sql += `  is_confirmed INTEGER,\n`;
    sql += `  confirmed_source TEXT,\n`;
    sql += `  established_year INTEGER,\n`;
    sql += `  heritage_notes TEXT,\n`;
    sql += `  practice_notes TEXT,\n`;
    sql += `  priority TEXT,\n`;
    sql += `  is_performed INTEGER,\n`;
    sql += `  performed_at TEXT,\n`;
    sql += `  performed_by TEXT,\n`;
    sql += `  performed_notes TEXT,\n`;
    sql += `  occurrence_2027 TEXT,\n`;
    sql += `  content_note TEXT,\n`;
    sql += `  memory_photos TEXT\n`;
    sql += `);\n\n`;

    for (const o of data.occasions) {
      sql += `INSERT OR REPLACE INTO occasions (id, family_id, title, occasion_type, recurrence_type, person_name_display, relationship_display, tithi_fields, gregorian_fields, is_confirmed, confirmed_source, established_year, heritage_notes, practice_notes, priority, is_performed, performed_at, performed_by, performed_notes, occurrence_2027, content_note, memory_photos)\n`;
      sql += `VALUES (${escapeSql(o.id)}, ${escapeSql(o.familyId)}, ${escapeSql(o.title)}, ${escapeSql(o.occasionType)}, ${escapeSql(o.recurrenceType)}, ${escapeSql(o.personNameDisplay)}, ${escapeSql(o.relationshipDisplay)}, ${escapeSql(JSON.stringify(o.tithiFields || {}))}, ${escapeSql(JSON.stringify(o.gregorianFields || {}))}, ${o.isConfirmed ? 1 : 0}, ${escapeSql(o.confirmedSource)}, ${o.establishedYear || 'NULL'}, ${escapeSql(o.heritageNotes)}, ${escapeSql(o.practiceNotes)}, ${escapeSql(o.priority)}, ${o.isPerformed ? 1 : 0}, ${escapeSql(o.performedAt)}, ${escapeSql(o.performedBy)}, ${escapeSql(o.performedNotes)}, ${escapeSql(JSON.stringify(o.occurrence2027 || {}))}, ${escapeSql(JSON.stringify(o.contentNote || {}))}, ${escapeSql(JSON.stringify(o.memoryPhotos || []))});\n`;
    }
    sql += `\n`;

    // Lineage Table
    sql += `-- Table: lineage_members\n`;
    sql += `CREATE TABLE IF NOT EXISTS lineage_members (\n`;
    sql += `  id TEXT PRIMARY KEY,\n`;
    sql += `  family_id TEXT NOT NULL REFERENCES families(id),\n`;
    sql += `  name TEXT NOT NULL,\n`;
    sql += `  name_devanagari TEXT,\n`;
    sql += `  relationship TEXT,\n`;
    sql += `  generation INTEGER,\n`;
    sql += `  generation_label TEXT,\n`;
    sql += `  is_ancestor INTEGER,\n`;
    sql += `  gotra TEXT,\n`;
    sql += `  kuldevta TEXT,\n`;
    sql += `  gender TEXT,\n`;
    sql += `  spouse_name TEXT,\n`;
    sql += `  location TEXT,\n`;
    sql += `  primary_role TEXT,\n`;
    sql += `  responsibilities TEXT\n`;
    sql += `);\n\n`;

    for (const lm of data.lineageMembers) {
      sql += `INSERT OR REPLACE INTO lineage_members (id, family_id, name, name_devanagari, relationship, generation, generation_label, is_ancestor, gotra, kuldevta, gender, spouse_name, location, primary_role, responsibilities)\n`;
      sql += `VALUES (${escapeSql(lm.id)}, ${escapeSql(lm.familyId)}, ${escapeSql(lm.name)}, ${escapeSql(lm.nameDevanagari)}, ${escapeSql(lm.relationship)}, ${lm.generation}, ${escapeSql(lm.generationLabel)}, ${lm.isAncestor ? 1 : 0}, ${escapeSql(lm.gotra)}, ${escapeSql(lm.kuldevta)}, ${escapeSql(lm.gender)}, ${escapeSql(lm.spouseName)}, ${escapeSql(lm.location)}, ${escapeSql(lm.primaryRole)}, ${escapeSql(JSON.stringify(lm.responsibilities || []))});\n`;
    }
    sql += `\n`;

    return sql;
  }
}

export const dbStore = new StorageEngine();
