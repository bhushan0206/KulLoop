import { 
  Family, 
  FamilyOccasion, 
  Member, 
  Person, 
  LineageMember 
} from '../types';
import { apiUrl } from '../utils/apiBase';
import { apiMutationHeaders } from '../utils/apiClientContext';
import { scopeBundleToFamily } from '../utils/familyDataScope';
import { mirrorDelete, mirrorSet } from '../utils/firestoreMirror';
import { UserProfile } from './firebase';

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

// Fetch all family data from the server JSON store (canonical). Optional Firestore mirror is write-only.
export async function fetchInitialDatabase(): Promise<DatabaseAllResponse | null> {
  try {
    const res = await fetch(apiUrl('/api/db/all'));
    if (!res.ok) {
      console.warn(`Server REST store unreachable: ${res.statusText}`);
      return null;
    }
    const bundle = (await res.json()) as DatabaseAllResponse;
    return scopeBundleToFamily(bundle);
  } catch (err) {
    console.error('Error fetching persistent database bundle from server:', err);
    return null;
  }
}

// Get live persistence engine status & file path
export async function fetchDbStatus(): Promise<DbStatusResponse | null> {
  try {
    const res = await fetch(apiUrl('/api/db/status'));
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
    const res = await fetch(apiUrl('/api/db/reset'), { method: 'POST', headers: await apiMutationHeaders() });
    return res.ok;
  } catch (err) {
    console.error('Failed to reset database:', err);
    return false;
  }
}

// Family persistence
export async function apiUpdateFamily(family: Family): Promise<Family | null> {
  try {
    const res = await fetch(apiUrl('/api/family'), {
      method: 'PUT',
      headers: await apiMutationHeaders(),
      body: JSON.stringify(family),
    });
    if (!res.ok) throw new Error('Failed to update family');
    const data = await res.json();
    await mirrorSet('families', family.id || 'current_family', data.family);
    return data.family;
  } catch (err) {
    console.error('apiUpdateFamily error:', err);
    return null;
  }
}

// Occasion persistence
export async function apiCreateOccasion(occ: FamilyOccasion): Promise<FamilyOccasion | null> {
  try {
    const res = await fetch(apiUrl('/api/occasions'), {
      method: 'POST',
      headers: await apiMutationHeaders(),
      body: JSON.stringify(occ),
    });
    if (!res.ok) throw new Error('Failed to create occasion');
    const data = await res.json();
    if (data.occasion) {
      await mirrorSet('occasions', occ.id, data.occasion, false);
    }
    return data.occasion;
  } catch (err) {
    console.error('apiCreateOccasion error:', err);
    return null;
  }
}

export async function apiUpdateOccasion(id: string, updates: Partial<FamilyOccasion>): Promise<FamilyOccasion | null> {
  try {
    const res = await fetch(apiUrl(`/api/occasions/${id}`), {
      method: 'PUT',
      headers: await apiMutationHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update occasion');
    const data = await res.json();
    if (data.occasion) {
      await mirrorSet('occasions', id, data.occasion);
    }
    return data.occasion;
  } catch (err) {
    console.error('apiUpdateOccasion error:', err);
    return null;
  }
}

export async function apiDeleteOccasion(id: string): Promise<boolean> {
  try {
    const res = await fetch(apiUrl(`/api/occasions/${id}`), {
      method: 'DELETE',
      headers: await apiMutationHeaders(),
    });
    if (res.ok) {
      await mirrorDelete('occasions', id);
    }
    return res.ok;
  } catch (err) {
    console.error('apiDeleteOccasion error:', err);
    return false;
  }
}

export async function apiToggleConfirm(id: string): Promise<FamilyOccasion | null> {
  try {
    const res = await fetch(apiUrl(`/api/occasions/${id}/toggle-confirm`), {
      method: 'PATCH',
      headers: await apiMutationHeaders(),
    });
    if (!res.ok) throw new Error('Failed to toggle confirm');
    const data = await res.json();
    if (data.occasion) {
      await mirrorSet('occasions', id, data.occasion);
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
    const res = await fetch(apiUrl(`/api/occasions/${id}/performed`), {
      method: 'PATCH',
      headers: await apiMutationHeaders(),
      body: JSON.stringify({ notes, performedBy }),
    });
    if (!res.ok) throw new Error('Failed to toggle performed');
    const data = await res.json();
    if (data.occasion) {
      await mirrorSet('occasions', id, data.occasion);
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
    const res = await fetch(apiUrl(`/api/occasions/${occasionId}/photos`), {
      method: 'POST',
      headers: await apiMutationHeaders(),
      body: JSON.stringify(photo),
    });
    if (!res.ok) throw new Error('Failed to add memory photo');
    const data = await res.json();
    if (data.occasion) {
      await mirrorSet('occasions', occasionId, data.occasion);
    }
    return data.occasion;
  } catch (err) {
    console.error('apiAddMemoryPhoto error:', err);
    return null;
  }
}

export async function apiDeleteMemoryPhoto(occasionId: string, photoId: string): Promise<FamilyOccasion | null> {
  try {
    const res = await fetch(apiUrl(`/api/occasions/${occasionId}/photos/${photoId}`), {
      method: 'DELETE',
      headers: await apiMutationHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete memory photo');
    const data = await res.json();
    if (data.occasion) {
      await mirrorSet('occasions', occasionId, data.occasion);
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
    const res = await fetch(apiUrl('/api/members'), {
      method: 'POST',
      headers: await apiMutationHeaders(),
      body: JSON.stringify(member),
    });
    if (!res.ok) throw new Error('Failed to create member');
    const data = await res.json();
    if (data.member) {
      await mirrorSet('members', member.id, data.member, false);
    }
    return data.member;
  } catch (err) {
    console.error('apiCreateMember error:', err);
    return null;
  }
}

export async function apiUpdateMember(member: Member): Promise<Member | null> {
  try {
    const res = await fetch(apiUrl(`/api/members/${member.id}`), {
      method: 'PUT',
      headers: await apiMutationHeaders(),
      body: JSON.stringify(member),
    });
    if (!res.ok) throw new Error('Failed to update member');
    const data = await res.json();
    if (data.member) {
      await mirrorSet('members', member.id, data.member);
    }
    return data.member;
  } catch (err) {
    console.error('apiUpdateMember error:', err);
    return null;
  }
}

export async function apiDeleteMember(id: string): Promise<boolean> {
  try {
    const res = await fetch(apiUrl(`/api/members/${id}`), {
      method: 'DELETE',
      headers: await apiMutationHeaders(),
    });
    if (res.ok) {
      await mirrorDelete('members', id);
    }
    return res.ok;
  } catch (err) {
    console.error('apiDeleteMember error:', err);
    return false;
  }
}

// Lineage
export interface InviteValidationResponse {
  valid: boolean;
  family?: Pick<Family, 'id' | 'name' | 'homeLocation' | 'convention' | 'inviteCode'>;
  message?: string;
}

export async function apiValidateInviteCode(code: string): Promise<InviteValidationResponse> {
  const normalized = encodeURIComponent(code.trim());
  try {
    const res = await fetch(apiUrl(`/api/invites/${normalized}`));
    if (!res.ok) {
      return { valid: false, message: 'Invite code not found.' };
    }
    return (await res.json()) as InviteValidationResponse;
  } catch {
    return { valid: false, message: 'Could not verify invite code.' };
  }
}

export async function apiRegisterPushDevice(payload: {
  token: string;
  platform: 'android' | 'web' | 'ios';
  uid?: string;
  memberId?: string;
  familyId?: string;
}): Promise<boolean> {
  try {
    const res = await fetch(apiUrl('/api/push/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function apiUpdateLineageMember(member: LineageMember): Promise<LineageMember | null> {
  try {
    const res = await fetch(apiUrl(`/api/lineage/${member.id}`), {
      method: 'PUT',
      headers: await apiMutationHeaders(),
      body: JSON.stringify(member),
    });
    if (!res.ok) throw new Error('Failed to update lineage member');
    const data = await res.json();
    if (data.member) {
      await mirrorSet('lineage', member.id, data.member);
    }
    return data.member;
  } catch (err) {
    console.error('apiUpdateLineageMember error:', err);
    return null;
  }
}

// People (ancestors / named persons)
export async function apiCreatePerson(person: Person): Promise<Person | null> {
  try {
    const res = await fetch(apiUrl('/api/people'), {
      method: 'POST',
      headers: await apiMutationHeaders(),
      body: JSON.stringify(person),
    });
    if (!res.ok) throw new Error('Failed to create person');
    const data = await res.json();
    return data.person as Person;
  } catch (err) {
    console.error('apiCreatePerson error:', err);
    return null;
  }
}

export async function apiUpdatePerson(person: Person): Promise<Person | null> {
  try {
    const res = await fetch(apiUrl(`/api/people/${person.id}`), {
      method: 'PUT',
      headers: await apiMutationHeaders(),
      body: JSON.stringify(person),
    });
    if (!res.ok) throw new Error('Failed to update person');
    const data = await res.json();
    return data.person as Person;
  } catch (err) {
    console.error('apiUpdatePerson error:', err);
    return null;
  }
}

export async function apiDeletePerson(id: string): Promise<boolean> {
  try {
    const res = await fetch(apiUrl(`/api/people/${id}`), {
      method: 'DELETE',
      headers: await apiMutationHeaders(),
    });
    return res.ok;
  } catch (err) {
    console.error('apiDeletePerson error:', err);
    return false;
  }
}
