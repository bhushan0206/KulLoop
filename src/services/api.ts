import { 
  Family, 
  FamilyOccasion, 
  Member, 
  Person, 
  LineageMember 
} from '../types';
import { UserProfile, db, handleFirestoreError, OperationType } from './firebase';
import { doc, setDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';

export interface DatabaseAllResponse {
  family: Family;
  occasions: FamilyOccasion[];
  members: Member[];
  people: Person[];
  lineageMembers: LineageMember[];
  users: UserProfile[];
  currentUser: UserProfile | null;
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
}

export interface DbStatusResponse {
  status: string;
  driver: string;
  version: number;
  persistenceFile: string;
  createdAt: string;
  lastSavedAt: string;
  recordsCount: {
    occasions: number;
    members: number;
    people: number;
    lineageMembers: number;
    users: number;
  };
  auditLogCount: number;
}

// Fetch all database records from Firestore or persistent store
export async function fetchInitialDatabase(): Promise<DatabaseAllResponse | null> {
  // 1. Attempt Firestore live collection fetch
  try {
    const occSnap = await getDocs(collection(db, 'occasions'));
    const memSnap = await getDocs(collection(db, 'members'));
    const linSnap = await getDocs(collection(db, 'lineage'));
    const famSnap = await getDocs(collection(db, 'families'));

    if (!occSnap.empty || !memSnap.empty) {
      const fsOccasions = occSnap.docs.map((d) => d.data() as FamilyOccasion);
      const fsMembers = memSnap.docs.map((d) => d.data() as Member);
      const fsLineage = linSnap.docs.map((d) => d.data() as LineageMember);
      const fsFamily = !famSnap.empty ? (famSnap.docs[0].data() as Family) : null;

      // Fetch base REST bundle for default fallback parts (e.g. people/currentUser)
      const baseRestRes = await fetch('/api/db/all').then((r) => r.ok ? r.json() : null).catch(() => null);

      if (fsOccasions.length > 0 || fsMembers.length > 0) {
        return {
          family: fsFamily || baseRestRes?.family,
          occasions: fsOccasions.length > 0 ? fsOccasions : baseRestRes?.occasions || [],
          members: fsMembers.length > 0 ? fsMembers : baseRestRes?.members || [],
          people: baseRestRes?.people || [],
          lineageMembers: fsLineage.length > 0 ? fsLineage : baseRestRes?.lineageMembers || [],
          users: baseRestRes?.users || [],
          currentUser: baseRestRes?.currentUser || null,
          meta: {
            driver: 'Firebase Firestore + JSON Backup',
            version: 1,
            createdAt: new Date().toISOString(),
            lastSavedAt: new Date().toISOString(),
            persistenceFile: 'Cloud Firestore (/occasions, /members, /lineage, /families)',
            recordsCount: {
              occasions: fsOccasions.length,
              members: fsMembers.length,
              people: baseRestRes?.people?.length || 0,
              lineageMembers: fsLineage.length,
              users: baseRestRes?.users?.length || 0,
            },
          },
        };
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'occasions');
  }

  // 2. Fallback to server REST store
  try {
    const res = await fetch('/api/db/all');
    if (!res.ok) {
      console.warn(`Server REST store unreachable: ${res.statusText}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error('Error fetching persistent database bundle from server:', err);
    return null;
  }
}

// Get live persistence engine status & file path
export async function fetchDbStatus(): Promise<DbStatusResponse | null> {
  try {
    const res = await fetch('/api/db/status');
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Failed to query DB status:', err);
    return null;
  }
}

// Reset database file to default seed
export async function resetDatabaseToDefaults(): Promise<boolean> {
  try {
    const res = await fetch('/api/db/reset', { method: 'POST' });
    return res.ok;
  } catch (err) {
    console.error('Failed to reset database:', err);
    return false;
  }
}

// Family persistence
export async function apiUpdateFamily(family: Family): Promise<Family | null> {
  try {
    await setDoc(doc(db, 'families', family.id || 'current_family'), family, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `families/${family.id}`);
  }

  try {
    const res = await fetch('/api/family', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(family),
    });
    if (!res.ok) throw new Error('Failed to update family');
    const data = await res.json();
    return data.family;
  } catch (err) {
    console.error('apiUpdateFamily error:', err);
    return null;
  }
}

// Occasion persistence
export async function apiCreateOccasion(occ: FamilyOccasion): Promise<FamilyOccasion | null> {
  try {
    await setDoc(doc(db, 'occasions', occ.id), occ);
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `occasions/${occ.id}`);
  }

  try {
    const res = await fetch('/api/occasions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(occ),
    });
    if (!res.ok) throw new Error('Failed to create occasion');
    const data = await res.json();
    return data.occasion;
  } catch (err) {
    console.error('apiCreateOccasion error:', err);
    return null;
  }
}

export async function apiUpdateOccasion(id: string, updates: Partial<FamilyOccasion>): Promise<FamilyOccasion | null> {
  try {
    await setDoc(doc(db, 'occasions', id), updates, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, `occasions/${id}`);
  }

  try {
    const res = await fetch(`/api/occasions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update occasion');
    const data = await res.json();
    return data.occasion;
  } catch (err) {
    console.error('apiUpdateOccasion error:', err);
    return null;
  }
}

export async function apiDeleteOccasion(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'occasions', id));
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, `occasions/${id}`);
  }

  try {
    const res = await fetch(`/api/occasions/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch (err) {
    console.error('apiDeleteOccasion error:', err);
    return false;
  }
}

export async function apiToggleConfirm(id: string): Promise<FamilyOccasion | null> {
  try {
    const res = await fetch(`/api/occasions/${id}/toggle-confirm`, { method: 'PATCH' });
    if (!res.ok) throw new Error('Failed to toggle confirm');
    const data = await res.json();
    if (data.occasion) {
      setDoc(doc(db, 'occasions', id), data.occasion, { merge: true }).catch(() => {});
    }
    return data.occasion;
  } catch (err) {
    console.error('apiToggleConfirm error:', err);
    return null;
  }
}

export async function apiTogglePerformed(
  id: string, 
  notes?: string, 
  performedBy?: string
): Promise<FamilyOccasion | null> {
  try {
    const res = await fetch(`/api/occasions/${id}/performed`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes, performedBy }),
    });
    if (!res.ok) throw new Error('Failed to toggle performed');
    const data = await res.json();
    if (data.occasion) {
      setDoc(doc(db, 'occasions', id), data.occasion, { merge: true }).catch(() => {});
    }
    return data.occasion;
  } catch (err) {
    console.error('apiTogglePerformed error:', err);
    return null;
  }
}

// Memory Photos
export async function apiAddMemoryPhoto(
  occasionId: string,
  photo: { id: string; url: string; caption?: string; year?: number; uploadedAt: string }
): Promise<FamilyOccasion | null> {
  try {
    const res = await fetch(`/api/occasions/${occasionId}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(photo),
    });
    if (!res.ok) throw new Error('Failed to add memory photo');
    const data = await res.json();
    if (data.occasion) {
      setDoc(doc(db, 'occasions', occasionId), data.occasion, { merge: true }).catch(() => {});
    }
    return data.occasion;
  } catch (err) {
    console.error('apiAddMemoryPhoto error:', err);
    return null;
  }
}

export async function apiDeleteMemoryPhoto(occasionId: string, photoId: string): Promise<FamilyOccasion | null> {
  try {
    const res = await fetch(`/api/occasions/${occasionId}/photos/${photoId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete memory photo');
    const data = await res.json();
    if (data.occasion) {
      setDoc(doc(db, 'occasions', occasionId), data.occasion, { merge: true }).catch(() => {});
    }
    return data.occasion;
  } catch (err) {
    console.error('apiDeleteMemoryPhoto error:', err);
    return null;
  }
}

// Members
export async function apiCreateMember(member: Member): Promise<Member | null> {
  try {
    await setDoc(doc(db, 'members', member.id), member);
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `members/${member.id}`);
  }

  try {
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member),
    });
    if (!res.ok) throw new Error('Failed to create member');
    const data = await res.json();
    return data.member;
  } catch (err) {
    console.error('apiCreateMember error:', err);
    return null;
  }
}

export async function apiUpdateMember(member: Member): Promise<Member | null> {
  try {
    await setDoc(doc(db, 'members', member.id), member, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, `members/${member.id}`);
  }

  try {
    const res = await fetch(`/api/members/${member.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member),
    });
    if (!res.ok) throw new Error('Failed to update member');
    const data = await res.json();
    return data.member;
  } catch (err) {
    console.error('apiUpdateMember error:', err);
    return null;
  }
}

export async function apiDeleteMember(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, 'members', id));
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, `members/${id}`);
  }

  try {
    const res = await fetch(`/api/members/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch (err) {
    console.error('apiDeleteMember error:', err);
    return false;
  }
}

// Lineage
export async function apiUpdateLineageMember(member: LineageMember): Promise<LineageMember | null> {
  try {
    await setDoc(doc(db, 'lineage', member.id), member, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, `lineage/${member.id}`);
  }

  try {
    const res = await fetch(`/api/lineage/${member.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member),
    });
    if (!res.ok) throw new Error('Failed to update lineage member');
    const data = await res.json();
    return data.member;
  } catch (err) {
    console.error('apiUpdateLineageMember error:', err);
    return null;
  }
}
