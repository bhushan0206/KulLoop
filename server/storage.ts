/**
 * In-memory family bundle for demo / offline fallback.
 * Canonical persistence is Firestore (see firestoreStore.ts + kulloopStore.ts).
 * This module no longer writes family PII to disk.
 */
import {
  Family,
  FamilyOccasion,
  Member,
  Person,
  LineageMember,
} from '../src/types';
import { UserProfile } from '../src/services/firebase';
import type { PushDeviceRecord } from './pushMessaging.js';

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

export function buildEmptyDatabase(familyId = 'fam_default'): DatabaseSchema {
  const now = new Date().toISOString();
  return {
    meta: {
      driver: 'memory-fallback',
      version: 2,
      createdAt: now,
      lastSavedAt: now,
      persistenceFile: 'memory://kulloop',
      recordsCount: {
        occasions: 0,
        members: 0,
        people: 0,
        lineageMembers: 0,
        users: 0,
      },
    },
    family: {
      id: familyId,
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
        entityId: 'memory',
        timestamp: now,
        details: 'In-memory fallback (Firestore is canonical when service account is configured)',
      },
    ],
  };
}

class MemoryStore {
  private cache: DatabaseSchema;

  constructor() {
    this.cache = buildEmptyDatabase();
    console.log(
      '[StorageEngine] In-memory fallback active. Configure FIREBASE_SERVICE_ACCOUNT_* for durable Firestore storage.'
    );
  }

  public getData(): DatabaseSchema {
    if (!this.cache.pushDevices) this.cache.pushDevices = [];
    if (!this.cache.reminderDispatchLog) this.cache.reminderDispatchLog = [];
    return this.cache;
  }

  public replace(next: DatabaseSchema): DatabaseSchema {
    next.meta.lastSavedAt = new Date().toISOString();
    next.meta.recordsCount = {
      occasions: next.occasions?.length || 0,
      members: next.members?.length || 0,
      people: next.people?.length || 0,
      lineageMembers: next.lineageMembers?.length || 0,
      users: Object.keys(next.users || {}).length,
    };
    this.cache = next;
    return this.cache;
  }

  public save(
    updater: (draft: DatabaseSchema) => void,
    actionName = 'UPDATE',
    entityType = 'UNKNOWN',
    entityId = '0'
  ): DatabaseSchema {
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
    return this.replace(current);
  }

  public saveUser(profile: UserProfile): UserProfile {
    const current = this.getData();
    current.users[profile.uid] = {
      ...current.users[profile.uid],
      ...profile,
      updatedAt: new Date().toISOString(),
    } as UserProfile;
    this.replace(current);
    return current.users[profile.uid];
  }

  public resetToDefaults(): DatabaseSchema {
    this.cache = buildEmptyDatabase();
    return this.cache;
  }

  public getDatabasePath(): string {
    return 'memory://kulloop (Firestore is canonical)';
  }

  public generateSqliteDump(): string {
    const data = this.getData();
    return `-- KulLoop SQLite export (from in-memory / Firestore snapshot)\n-- Generated ${new Date().toISOString()}\n-- Family: ${data.family.name} (${data.family.id})\n-- Occasions: ${data.occasions.length} Members: ${data.members.length}\n`;
  }
}

/** @deprecated Prefer kulloopStore.getBundle / mutateBundle — kept for legacy sync call sites during transition */
export const dbStore = new MemoryStore();
export const memoryStore = dbStore;
