import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

import {
  getBundle,
  mutateBundle,
  resetActiveFamily,
  saveUser,
  fetchUser,
  fetchUsers,
  isFirestoreCanonical,
} from './server/kulloopStore.js';
import { resolveFamilyId } from './server/firestoreStore.js';
import { runReminderWorker, startReminderCron } from './server/reminderWorker.js';
import { sendEmail } from './server/mailer.js';
import { sendFcmToToken } from './server/pushMessaging.js';
import { gate, gateMemberUpdate } from './server/accessMiddleware.js';

// ============================================================================
// Persistent Database (Firestore canonical) & Export Endpoints
// ============================================================================

// Database engine status and stats
app.get('/api/db/status', async (req, res) => {
  try {
    const data = await getBundle(req);
    res.json({
      status: 'connected',
      driver: data.meta.driver,
      canonical: isFirestoreCanonical() ? 'firestore' : 'memory',
      version: data.meta.version,
      persistenceFile: data.meta.persistenceFile,
      createdAt: data.meta.createdAt,
      lastSavedAt: data.meta.lastSavedAt,
      recordsCount: data.meta.recordsCount,
      auditLogCount: data.auditLogs.length,
    });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'db status failed' });
  }
});

// Fetch all database records in a single payload for fast boot
app.get('/api/db/all', async (req, res) => {
  try {
    const data = await getBundle(req);
    res.json({
      family: data.family,
      occasions: data.occasions,
      members: data.members,
      people: data.people,
      lineageMembers: data.lineageMembers,
      users: Object.values(data.users),
      currentUser: null,
      meta: data.meta,
    });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'db load failed' });
  }
});

// Reset database to initial seed data
app.post('/api/db/reset', ...gate('canEditFamily'), async (req, res) => {
  try {
    const refreshed = await resetActiveFamily(req);
    res.json({
      success: true,
      message: 'Family ledger reset successfully',
      recordsCount: refreshed.meta.recordsCount,
    });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'reset failed' });
  }
});

// SQLite SQL Dump / DDL export
app.get('/api/db/export/sqlite-sql', async (req, res) => {
  try {
    const data = await getBundle(req);
    const sqlContent = `-- KulLoop export ${new Date().toISOString()}\n-- Family ${data.family.name} (${data.family.id})\n-- Occasions ${data.occasions.length} Members ${data.members.length}\n`;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="kulloop_database_sqlite.sql"');
    res.send(sqlContent);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'export failed' });
  }
});

// Family Profile Endpoints
app.get('/api/family', async (req, res) => {
  try {
    const data = await getBundle(req);
    res.json(data.family);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'family load failed' });
  }
});

function normalizeInviteCode(raw: string): string {
  const cleaned = raw.trim().toUpperCase().replace(/\s+/g, '');
  if (cleaned.startsWith('KUL-')) return cleaned;
  if (/^[A-Z0-9]{6}$/.test(cleaned)) return `KUL-${cleaned}`;
  return cleaned;
}

function generateInviteCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `KUL-${suffix}`;
}

app.post('/api/push/register', async (req, res) => {
  try {
    const { token, platform, uid, memberId, familyId } = req.body || {};
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'FCM device token required' });
    }
    const deviceId = `push_${uid || memberId || 'anon'}_${token.slice(-8)}`;
    const record = {
      id: deviceId,
      token,
      platform: platform === 'android' || platform === 'ios' || platform === 'web' ? platform : 'android',
      uid: uid || undefined,
      memberId: memberId || undefined,
      familyId: familyId || undefined,
      updatedAt: new Date().toISOString(),
    };
    await mutateBundle(
      req,
      (draft) => {
        if (!draft.pushDevices) draft.pushDevices = [];
        const idx = draft.pushDevices.findIndex((d) => d.token === token);
        if (idx >= 0) {
          draft.pushDevices[idx] = { ...draft.pushDevices[idx], ...record };
        } else {
          draft.pushDevices.push(record);
        }
      },
      'REGISTER_PUSH',
      'DEVICE',
      deviceId
    );
    res.json({ success: true, deviceId });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'push register failed' });
  }
});

app.post('/api/push/test', ...gate('canManageMembers'), async (req, res) => {
  const { token, title, body, uid } = req.body || {};
  let targetToken = token as string | undefined;
  if (!targetToken && uid) {
    const data = await getBundle(req);
    const device = data.pushDevices?.find((d) => d.uid === uid);
    targetToken = device?.token;
  }
  if (!targetToken) {
    return res.status(400).json({ error: 'No device token (register push first)' });
  }
  const result = await sendFcmToToken(targetToken, {
    title: title || 'KulLoop · Family Tithi',
    body: body || 'Your sacred tithi reminder channel is connected.',
    data: { source: 'kulloop-test' },
  });
  res.json(result);
});

app.get('/api/invites/:code', async (req, res) => {
  try {
    const code = normalizeInviteCode(req.params.code || '');
    if (isFirestoreCanonical()) {
      const familyId = await resolveFamilyId({ inviteCode: code });
      if (!familyId) {
        return res.status(404).json({ valid: false, message: 'Invite code not found.' });
      }
      const data = await getBundle(undefined, familyId);
      return res.json({
        valid: true,
        family: {
          id: data.family.id,
          name: data.family.name,
          homeLocation: data.family.homeLocation,
          convention: data.family.convention,
          inviteCode: data.family.inviteCode,
        },
      });
    }

    const data = await getBundle(req);
    const fam = data.family;
    const famCode = fam.inviteCode ? normalizeInviteCode(fam.inviteCode) : '';
    const matches = Boolean(famCode && famCode === code);
    if (!matches) {
      return res.status(404).json({ valid: false, message: 'Invite code not found.' });
    }
    res.json({
      valid: true,
      family: {
        id: fam.id,
        name: fam.name,
        homeLocation: fam.homeLocation,
        convention: fam.convention,
        inviteCode: fam.inviteCode,
      },
    });
  } catch (err: unknown) {
    res.status(500).json({ valid: false, message: err instanceof Error ? err.message : 'invite lookup failed' });
  }
});

// Reminder Automation Endpoint (configurator / co_karta)
app.post('/api/reminders/trigger', ...gate('canManageMembers'), async (req, res) => {
  try {
    const logs = await runReminderWorker();
    res.json({ success: true, message: 'Reminder worker triggered successfully.', logs });
  } catch (error) {
    console.error('Error triggering reminder worker:', error);
    res.status(500).json({ error: 'Failed to trigger reminder worker.' });
  }
});

/**
 * Vercel Cron (and manual ops) entry — no family session required.
 * Requires Authorization: Bearer ${CRON_SECRET} (configure the same secret on the Vercel Cron job).
 */
app.get('/api/reminders/cron', async (req, res) => {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = String(req.headers.authorization || '');
  if (!secret || auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized cron invoke' });
  }
  try {
    const logs = await runReminderWorker();
    res.json({ success: true, source: 'bearer', logs });
  } catch (error) {
    console.error('Error in /api/reminders/cron:', error);
    res.status(500).json({ error: 'Reminder cron failed.' });
  }
});

// Single or Digest Email Dispatch Endpoint (Free Tier / SMTP)
app.post('/api/reminders/send-email', ...gate('canManageMembers'), async (req, res) => {
  const { to, subject, html, occasionTitle, familyName, dateStr, tithiName } = req.body;
  if (!to) {
    return res.status(400).json({ error: 'Recipient email is required' });
  }

  const emailSubject = subject || `[KulLoop] ${familyName || 'Family'} Observance: ${occasionTitle || 'Upcoming Sacred Tithi'}`;
  const emailHtml = html || `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e7e5e4; border-radius: 12px; background-color: #fafaf9; color: #1c1917;">
      <div style="background-color: #1c1917; color: #fef3c7; padding: 16px 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 20px; font-weight: 700;">KulLoop · Family Tithi Reminders</h2>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #d6d3d1;">Sacred observances calculated for ${familyName || 'your family'}</p>
      </div>
      <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e7e5e4; margin-bottom: 20px;">
        <h3 style="margin-top: 0; color: #b45309; font-size: 18px;">${occasionTitle || 'Sacred Observance'}</h3>
        <p style="margin: 8px 0; font-size: 14px;"><strong>Date:</strong> ${dateStr || 'Upcoming in 2027'}</p>
        <p style="margin: 8px 0; font-size: 14px;"><strong>Tithi / Paksha:</strong> ${tithiName || 'Traditional Panchang Timing'}</p>
        <p style="margin: 12px 0 0 0; font-size: 13px; color: #57534e; line-height: 1.5;">This reminder was sent with zero charges via your configured KulLoop Notification Hub. No apps for elders required.</p>
      </div>
      <p style="font-size: 11px; color: #78716c; text-align: center; margin: 0;">KulLoop — Independent Family Ritual Service</p>
    </div>
  `;

  try {
    const sent = await sendEmail(to, emailSubject, emailHtml);
    if (sent) {
      res.json({ success: true, message: `Email reminder delivered to ${to}` });
    } else {
      console.log(`[SMTP failed] Email reminder to ${to}: ${emailSubject}`);
      res.status(502).json({ success: false, message: `Email could not be delivered to ${to}. Check SMTP settings.` });
    }
  } catch (err: unknown) {
    console.error('Error in /api/reminders/send-email:', err);
    res.status(500).json({ success: false, message: `Email send failed for ${to}` });
  }
});

app.post('/api/gemini/transcribe', async (req, res) => {
  const { audioBase64, mimeType } = req.body;
  if (!audioBase64 || !mimeType) return res.status(400).json({ error: 'Missing audio data' });

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: { parts: [{ inlineData: { mimeType, data: audioBase64 } }, { text: 'Transcribe this audio.' }] },
    });
    res.json({ text: response.text });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/gemini/tts', async (req, res) => {
  const { text, voiceName } = req.body;
  if (!text) return res.status(400).json({ error: 'Missing text' });

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [{ role: 'user', parts: [{ text }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' } } },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error('No audio generated');
    res.json({ audioBase64: base64Audio });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/family', ...gate('canEditFamily'), async (req, res) => {
  const updatedFamily = req.body;
  if (!updatedFamily || !updatedFamily.name) {
    return res.status(400).json({ error: 'Valid family object required' });
  }
  try {
    const updated = await mutateBundle(
      req,
      (draft) => {
        const lockedId = draft.family.id;
        const emptyShell =
          lockedId === 'fam_default' &&
          draft.members.length === 0 &&
          draft.occasions.length === 0;
        // New onboarding may mint fam_<ts>; only allow id change from empty default shell
        const nextId =
          emptyShell && updatedFamily.id && updatedFamily.id !== lockedId
            ? updatedFamily.id
            : lockedId;
        const next = { ...draft.family, ...updatedFamily, id: nextId };
        if (!next.inviteCode) {
          next.inviteCode = generateInviteCode();
        }
        draft.family = next;
      },
      'UPDATE_FAMILY',
      'FAMILY',
      updatedFamily.id || 'family'
    );
    res.json({ success: true, family: updated.family });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'family update failed' });
  }
});

// Occasions Endpoints
app.get('/api/occasions', async (req, res) => {
  try {
    const data = await getBundle(req);
    res.json(data.occasions);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'occasions load failed' });
  }
});

app.post('/api/occasions', ...gate('canCreateOccasions'), async (req, res) => {
  const newOccasion = req.body;
  if (!newOccasion || !newOccasion.title) {
    return res.status(400).json({ error: 'Occasion title is required' });
  }
  if (!newOccasion.id) {
    newOccasion.id = `occ_${Date.now()}`;
  }
  try {
    const data = await getBundle(req);
    if (!newOccasion.familyId) newOccasion.familyId = data.family.id;
    await mutateBundle(
      req,
      (draft) => {
        draft.occasions.unshift(newOccasion);
      },
      'ADD_OCCASION',
      'OCCASION',
      newOccasion.id
    );
    res.status(201).json({ success: true, occasion: newOccasion });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'create occasion failed' });
  }
});

app.put('/api/occasions/:id', ...gate('canEditOccasions'), async (req, res) => {
  const id = req.params.id;
  const updates = req.body;
  let updatedOccasion: any = null;
  try {
    await mutateBundle(
      req,
      (draft) => {
        const idx = draft.occasions.findIndex((o) => o.id === id);
        if (idx !== -1) {
          draft.occasions[idx] = { ...draft.occasions[idx], ...updates, id };
          updatedOccasion = draft.occasions[idx];
        }
      },
      'UPDATE_OCCASION',
      'OCCASION',
      id
    );
    if (!updatedOccasion) {
      return res.status(404).json({ error: 'Occasion not found' });
    }
    res.json({ success: true, occasion: updatedOccasion });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'update occasion failed' });
  }
});

app.delete('/api/occasions/:id', ...gate('canDeleteOccasions'), async (req, res) => {
  const id = req.params.id;
  try {
    await mutateBundle(
      req,
      (draft) => {
        draft.occasions = draft.occasions.filter((o) => o.id !== id);
      },
      'DELETE_OCCASION',
      'OCCASION',
      id
    );
    res.json({ success: true, message: `Occasion ${id} deleted` });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'delete occasion failed' });
  }
});

app.patch('/api/occasions/:id/toggle-confirm', ...gate('canEditOccasions'), async (req, res) => {
  const id = req.params.id;
  let updatedOccasion: any = null;
  try {
    await mutateBundle(
      req,
      (draft) => {
        const occ = draft.occasions.find((o) => o.id === id);
        if (occ) {
          occ.isConfirmed = !occ.isConfirmed;
          if (occ.occurrence2027) {
            occ.occurrence2027.isVerified = occ.isConfirmed;
          }
          updatedOccasion = occ;
        }
      },
      'TOGGLE_CONFIRM_OCCASION',
      'OCCASION',
      id
    );
    if (!updatedOccasion) {
      return res.status(404).json({ error: 'Occasion not found' });
    }
    res.json({ success: true, occasion: updatedOccasion });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'toggle confirm failed' });
  }
});

app.patch('/api/occasions/:id/performed', ...gate('canMarkPerformed'), async (req, res) => {
  const id = req.params.id;
  const { notes, performedBy } = req.body || {};
  let updatedOccasion: any = null;
  try {
    await mutateBundle(
      req,
      (draft) => {
        const occ = draft.occasions.find((o) => o.id === id);
        if (occ) {
          const nextState = !occ.isPerformed;
          occ.isPerformed = nextState;
          if (nextState) {
            occ.performedAt =
              new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
              ', ' +
              new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            occ.performedBy = performedBy || draft.family?.name || 'Family';
            occ.performedNotes = notes;
          } else {
            occ.performedAt = undefined;
            occ.performedBy = undefined;
            occ.performedNotes = undefined;
          }
          updatedOccasion = occ;
        }
      },
      'TOGGLE_PERFORMED_OCCASION',
      'OCCASION',
      id
    );
    if (!updatedOccasion) return res.status(404).json({ error: 'Occasion not found' });
    res.json({ success: true, occasion: updatedOccasion });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'performed toggle failed' });
  }
});

app.post('/api/occasions/:id/photos', ...gate('canEditOccasions'), async (req, res) => {
  const id = req.params.id;
  const photo = req.body;
  if (!photo || !photo.url) {
    return res.status(400).json({ error: 'Photo URL is required' });
  }
  if (!photo.id) photo.id = `photo_${Date.now()}`;
  if (!photo.uploadedAt) {
    photo.uploadedAt = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  let updatedOccasion: any = null;
  try {
    await mutateBundle(
      req,
      (draft) => {
        const occ = draft.occasions.find((o) => o.id === id);
        if (occ) {
          if (!occ.memoryPhotos) occ.memoryPhotos = [];
          occ.memoryPhotos.push(photo);
          updatedOccasion = occ;
        }
      },
      'ADD_MEMORY_PHOTO',
      'OCCASION',
      id
    );
    if (!updatedOccasion) return res.status(404).json({ error: 'Occasion not found' });
    res.json({ success: true, occasion: updatedOccasion, photo });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'add photo failed' });
  }
});

app.delete('/api/occasions/:id/photos/:photoId', ...gate('canEditOccasions'), async (req, res) => {
  const { id, photoId } = req.params;
  let updatedOccasion: any = null;
  try {
    await mutateBundle(
      req,
      (draft) => {
        const occ = draft.occasions.find((o) => o.id === id);
        if (occ && occ.memoryPhotos) {
          occ.memoryPhotos = occ.memoryPhotos.filter((p) => p.id !== photoId);
          updatedOccasion = occ;
        }
      },
      'DELETE_MEMORY_PHOTO',
      'OCCASION',
      id
    );
    if (!updatedOccasion) return res.status(404).json({ error: 'Occasion not found' });
    res.json({ success: true, occasion: updatedOccasion });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'delete photo failed' });
  }
});

app.get('/api/members', async (req, res) => {
  try {
    const data = await getBundle(req);
    res.json(data.members);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'members load failed' });
  }
});

app.post('/api/members', ...gate('canManageMembers'), async (req, res) => {
  const member = req.body;
  if (!member || !member.name) {
    return res.status(400).json({ error: 'Member name is required' });
  }
  if (!member.id) member.id = `mem_${Date.now()}`;
  try {
    const data = await getBundle(req);
    if (!member.familyId) member.familyId = data.family.id;
    let saved = member;
    await mutateBundle(
      req,
      (draft) => {
        const idx = draft.members.findIndex((m) => m.id === member.id);
        if (idx >= 0) {
          draft.members[idx] = { ...draft.members[idx], ...member, id: member.id };
          saved = draft.members[idx];
        } else if (member.authUid) {
          const byUid = draft.members.findIndex((m) => m.authUid === member.authUid);
          if (byUid >= 0) {
            draft.members[byUid] = { ...draft.members[byUid], ...member, id: draft.members[byUid].id };
            saved = draft.members[byUid];
          } else {
            draft.members.push(member);
          }
        } else {
          draft.members.push(member);
        }
      },
      'ADD_MEMBER',
      'MEMBER',
      member.id
    );
    res.status(201).json({ success: true, member: saved });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'add member failed' });
  }
});

app.put('/api/members/:id', ...gateMemberUpdate(), async (req, res) => {
  const id = req.params.id;
  const updates = req.body;
  let updatedMember: any = null;
  try {
    await mutateBundle(
      req,
      (draft) => {
        const idx = draft.members.findIndex((m) => m.id === id);
        if (idx !== -1) {
          draft.members[idx] = { ...draft.members[idx], ...updates, id };
          updatedMember = draft.members[idx];
        }
      },
      'UPDATE_MEMBER',
      'MEMBER',
      id
    );
    if (!updatedMember) return res.status(404).json({ error: 'Member not found' });
    res.json({ success: true, member: updatedMember });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'update member failed' });
  }
});

app.delete('/api/members/:id', ...gate('canManageMembers'), async (req, res) => {
  const id = req.params.id;
  try {
    await mutateBundle(
      req,
      (draft) => {
        draft.members = draft.members.filter((m) => m.id !== id);
      },
      'DELETE_MEMBER',
      'MEMBER',
      id
    );
    res.json({ success: true, message: `Member ${id} removed` });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'delete member failed' });
  }
});

app.get('/api/lineage', async (req, res) => {
  try {
    const data = await getBundle(req);
    res.json(data.lineageMembers);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'lineage load failed' });
  }
});

app.put('/api/lineage/:id', ...gate('canEditLineage'), async (req, res) => {
  const id = req.params.id;
  const updates = req.body;
  let updatedLineageMember: any = null;
  try {
    await mutateBundle(
      req,
      (draft) => {
        const idx = draft.lineageMembers.findIndex((m) => m.id === id);
        if (idx !== -1) {
          draft.lineageMembers[idx] = { ...draft.lineageMembers[idx], ...updates, id };
          updatedLineageMember = draft.lineageMembers[idx];
        }
      },
      'UPDATE_LINEAGE',
      'LINEAGE',
      id
    );
    if (!updatedLineageMember) return res.status(404).json({ error: 'Lineage member not found' });
    res.json({ success: true, member: updatedLineageMember });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'update lineage failed' });
  }
});

app.get('/api/people', async (req, res) => {
  try {
    const data = await getBundle(req);
    res.json(data.people);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'people load failed' });
  }
});

app.post('/api/people', ...gate('canCreateOccasions'), async (req, res) => {
  const person = req.body;
  if (!person || !person.name) {
    return res.status(400).json({ error: 'Person name is required' });
  }
  if (!person.id) person.id = `per_${Date.now()}`;
  try {
    const data = await getBundle(req);
    if (!person.familyId) person.familyId = data.family.id;
    await mutateBundle(
      req,
      (draft) => {
        const idx = draft.people.findIndex((p) => p.id === person.id);
        if (idx >= 0) {
          draft.people[idx] = { ...draft.people[idx], ...person, id: person.id };
        } else {
          draft.people.push(person);
        }
      },
      'ADD_PERSON',
      'PERSON',
      person.id
    );
    res.status(201).json({ success: true, person });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'add person failed' });
  }
});

app.put('/api/people/:id', ...gate('canEditOccasions'), async (req, res) => {
  const id = req.params.id;
  const updates = req.body;
  let updated: any = null;
  try {
    await mutateBundle(
      req,
      (draft) => {
        const idx = draft.people.findIndex((p) => p.id === id);
        if (idx !== -1) {
          draft.people[idx] = { ...draft.people[idx], ...updates, id };
          updated = draft.people[idx];
        }
      },
      'UPDATE_PERSON',
      'PERSON',
      id
    );
    if (!updated) return res.status(404).json({ error: 'Person not found' });
    res.json({ success: true, person: updated });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'update person failed' });
  }
});

app.delete('/api/people/:id', ...gate('canDeleteOccasions'), async (req, res) => {
  const id = req.params.id;
  try {
    await mutateBundle(
      req,
      (draft) => {
        draft.people = draft.people.filter((p) => p.id !== id);
      },
      'DELETE_PERSON',
      'PERSON',
      id
    );
    res.json({ success: true, message: `Person ${id} removed` });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'delete person failed' });
  }
});

app.get('/api/users', async (_req, res) => {
  try {
    res.json(await fetchUsers());
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'users load failed' });
  }
});

app.get('/api/users/:uid', async (req, res) => {
  try {
    const profile = await fetchUser(req.params.uid);
    if (!profile) return res.status(404).json({ error: 'User not found' });
    res.json(profile);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'user load failed' });
  }
});

app.post('/api/users', async (req, res) => {
  const profileData = req.body;
  if (!profileData || !profileData.uid || !profileData.username) {
    return res.status(400).json({ error: 'Missing required profile fields (uid, username)' });
  }
  try {
    const existing = (await fetchUser(profileData.uid)) || {};
    const savedProfile = await saveUser({
      ...existing,
      ...profileData,
      updatedAt: new Date().toISOString(),
    });
    res.json({ success: true, profile: savedProfile });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'save user failed' });
  }
});

// Helper to wait
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Curated Vedic Knowledge Fallback for high-demand API spikes
function getVedicFallbackResponse(query: string, userInterests: string[] = []): string {
  const q = query.toLowerCase();

  if (q.includes('shift') || q.includes('english') || q.includes('gregorian') || q.includes('date') || q.includes('year') || q.includes('change')) {
    return `**Why Hindu Tithis Shift on the Gregorian Calendar:**

1. **Lunar vs. Solar Year**: The Gregorian calendar is strictly solar (~365.24 days). The Hindu lunar calendar (चांद्रवर्ष) measures 12 lunar cycles (~354.36 days), creating an annual discrepancy of approximately 11 days.
2. **Tithi Definition**: A Tithi is not a 24-hour clock day. It is defined as a 12-degree elongation of the Moon from the Sun, lasting anywhere between 19 to 26 hours.
3. **Udayatithi (उदयातिथि)**: A tithi is observed on the solar day when it is active at the exact moment of local sunrise.
4. **Adhik Maas (अधिक मास)**: Every ~32.5 months, an intercalary (leap) month is added to realign the lunar calendar with the solar seasons.

*Delivered via KulLoop Vedic Knowledge Guide while the Gemini engine is handling high traffic.*`;
  }

  if (q.includes('amanta') || q.includes('purnimanta') || q.includes('difference') || q.includes('month')) {
    return `**Amanta vs. Purnimanta Calendars:**

1. **Amanta System (अमान्त)**:
   - The month begins after Amavasya (New Moon) and ends on the next Amavasya.
   - Traditional in: Maharashtra, Gujarat, Karnataka, Andhra Pradesh, Telangana, Tamil Nadu, and Goa.
2. **Purnimanta System (पूर्णिमान्त)**:
   - The month begins after Purnima (Full Moon) and ends on the next Purnima.
   - Traditional in: Uttar Pradesh, Bihar, Rajasthan, Madhya Pradesh, Haryana, and North India.
3. **Shared Shukla Paksha**: Both systems celebrate Shukla Paksha (waxing phase) on the exact same days! The names only diverge during Krishna Paksha (waning phase) by one month name.
4. **Shraddha & Observances**: When coordinating across states or diaspora, specifying the Tithi, Paksha, and Month system ensures complete family harmony without confusion.

*Delivered via KulLoop Vedic Knowledge Guide while the Gemini engine is handling high traffic.*`;
  }

  if (q.includes('shraddha') || q.includes('ancestor') || q.includes('pitru') || q.includes('items') || q.includes('ready') || q.includes('checklist')) {
    return `**Essential Checklist for Ancestral Shraddha (श्राद्ध विधी तयारी):**

1. **Sacred Essentials (पूजा साहित्य)**:
   - Darbha grass (दर्भ / कुशा) for pavitra rings and seats
   - Black sesame seeds (काळे तीळ - Til) for tarpan
   - Barley flour or rice flour (जव / तांदळाचे पीठ) for Pinda preparation
   - Pure cow's milk, homemade curd, honey, and pure ghee
   - Ganga jal or clean pure spring water in a copper pot (तांब्या)
2. **Satvik Meal (पितृ नैवेद्य)**:
   - Pure vegetarian meal prepared with calm reverence (traditionally kheer/payasam, puris, and favorite satvik dishes of the ancestors). Avoid pungent spices, onion, garlic, or asafoetida.
3. **Three Offerings (तीन नैवेद्य)**:
   - **Gau-grasa (गो-ग्रास)**: Offering dedicated to cows
   - **Kaka-bali (काकबळी)**: Offering kept outdoors for birds/crows
   - **Brahmana / Elder Dakshina**: Respectful dana given to the officiating priest or elderly guide.
4. **Mental State**: Perform with Shraddha (श्रद्धा - devotion and gratitude), never with fear or anxiety.

*Delivered via KulLoop Vedic Knowledge Guide while the Gemini engine is handling high traffic.*`;
  }

  if (q.includes('sunrise') || q.includes('diaspora') || q.includes('toronto') || q.includes('london') || q.includes('location')) {
    return `**Local Sunrise & Diaspora Observances (स्थानिक सूर्योदय नियम):**

1. **The Udayatithi Principle**: In Vedic tradition, rituals (especially vrat and shraddha) are tied to the tithi prevailing at **local sunrise** at your physical place of residence.
2. **Time Zone Reality**: Because the Moon moves independently of Earth's rotational time zones, a Tithi might be active at 6:15 AM in Mumbai, but by the time sunrise occurs in London or Toronto (5-9 hours later), the tithi may have concluded.
3. **KulLoop's Calculation**: KulLoop computes the solar elevation and tithi bounds for the specific city where the ritual is physically performed, giving you peace of mind that rituals are honored accurately.

*Delivered via KulLoop Vedic Knowledge Guide while the Gemini engine is handling high traffic.*`;
  }

  return `Namaskar! 🙏 Here are the core KulLoop Vedic heritage principles for your family:

1. **Dignified Preservation**: Our heritage is based on gratitude (कृतज्ञता), not fear. KulLoop never supports fear-based astrology or commercial superstition.
2. **Accurate Tithis**: Observances follow the Udayatithi (tithi at local sunrise) according to your family's Amanta or Purnimanta tradition.
3. **Family Coordination**: Share clean Priest-Ready Notes (संकल्प नोंद) and synced digital calendars so every generation stays connected to sacred ancestral roots.

*Note: The Gemini AI engine is currently experiencing temporary high traffic. Your query has been answered by the built-in KulLoop Vedic Reference Guide.*`;
}

// Gemini Multi-Turn Heritage Assistant API with automatic retry and model fallback
app.post('/api/gemini/chat', async (req, res) => {
  const { messages, userInterests, model: requestedModel, familyContext, simpleUi } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY is not configured in the environment.'
    });
  }

  const latestUserMsg = messages[messages.length - 1]?.text || '';

  // Prepare model priority list
  // If user asked for a specific model, try it first, then fall back to high-availability alternatives
  const primaryModel = requestedModel || 'gemini-2.5-flash';
  const fallbackModel = primaryModel === 'gemini-2.0-flash' ? 'gemini-2.5-flash' : 'gemini-2.0-flash';
  const candidateModels = [primaryModel, fallbackModel];

  // Format conversation history for @google/genai
  const formattedContents = messages.map((m: { role: string; text?: string; content?: string }) => ({
    role: m.role === 'model' ? 'model' : 'user',
    parts: [{ text: m.text || m.content || '' }],
  }));

  const contextBlock = familyContext
    ? `\nFamily calendar context (use for relevance; do not invent dates beyond this):\n${familyContext}`
    : '';
  const brevity = simpleUi
    ? 'Keep answers under 120 words unless the user asks for detail. Offer at most 3 short bullets.'
    : 'Prefer concise WhatsApp-shareable answers (under ~180 words unless detail is requested).';

  const systemInstruction = `You are the KulLoop Heritage & Tithi Assistant (संस्कार व कुलधर्म मार्गदर्शक), an expert, respectful, and calm guide for Indian family traditions, panchang calculations, ancestral shraddha rites, tithi birthdays, and festival observances.
Key principles:
1. Tone: Respectful, calm, dignified, culturally authentic. Never sell fear, avoid astrology predictions or dosha warnings.
2. Tithi & Calendar: Explain the difference between Amanta (common in Maharashtra, Gujarat, South India) and Purnimanta (North India). Mention that tithis depend on local sunrise (उदयातिथि).
3. Rituals & Shraddhas: Explain the significance of Mahalaya (Pitru Paksha), annual shraddha, Gau-grasa (cow offering), and practical items to keep ready (darbha grass, black sesame/til).
4. Community & Passions: If the user has specific passions or interests (${userInterests ? userInterests.join(', ') : 'Family Heritage'}), highlight connections to relevant traditions and suggest meaningful ways to engage with family and community members.
5. Language: You can respond in English, Hindi, or Marathi depending on what the user asks or uses.
6. MyDharohar partner: For printable shraddha and festival preparation guides, recommend https://www.mydharohar.org/ — KulLoop handles family dates and reminders; MyDharohar hosts reviewed preparation content. Never imply MyDharohar receives private family records.
7. Modern use: ${brevity} Mention voice/TTS only when helpful for elders. Do not invent muhurats — suggest verifying with family pandit or panchang.${contextBlock}`;

  const ai = new GoogleGenAI({ apiKey });
  let lastError: any = null;

  for (const modelToTry of candidateModels) {
    // Try up to 2 attempts per model with exponential backoff on 503/429
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (attempt > 0) {
          await wait(800 * attempt); // wait 800ms before retry
        }

        const response = await ai.models.generateContent({
          model: modelToTry,
          contents: formattedContents,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });

        const replyText = response.text || 'I am here to help you with your family tithis, traditions, and heritage.';
        return res.json({
          reply: replyText,
          modelUsed: modelToTry,
          isFallback: modelToTry !== primaryModel,
        });
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isTemporarySpike = errMsg.includes('503') || 
                                 errMsg.includes('UNAVAILABLE') || 
                                 errMsg.includes('high demand') || 
                                 errMsg.includes('429') || 
                                 errMsg.includes('RESOURCE_EXHAUSTED');

        console.warn(`Attempt ${attempt + 1} with model ${modelToTry} encountered error:`, errMsg);

        if (!isTemporarySpike) {
          // Non-transient error, break to next model or fallback
          break;
        }
      }
    }
  }

  // If all live model attempts failed (e.g. persistent 503 spike upstream), provide rich Vedic guidance fallback
  console.warn('All Gemini model candidates exhausted or experiencing high demand. Engaging KulLoop Vedic Knowledge engine.');
  const fallbackReply = getVedicFallbackResponse(latestUserMsg, userInterests);
  
  return res.json({
    reply: fallbackReply,
    modelUsed: 'offline-vedic-engine',
    isFallback: true,
    warning: lastError?.message || 'Gemini model is currently experiencing temporary high demand.'
  });
});

// Vite middleware in dev or static serving in production (local / long-running Node hosts)
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  // In-process interval cron — Vercel uses /api/reminders/cron instead (see vercel.json)
  startReminderCron();

  app.listen(port, '0.0.0.0', () => {
    console.log(`KulLoop server running on port ${port}`);
  });
}

export default app;

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
if (!isServerless) {
  startServer();
}
