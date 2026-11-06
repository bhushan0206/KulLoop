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

import { dbStore } from './server/storage';
import { runReminderWorker } from './server/reminderWorker';
import { sendEmail } from './server/mailer';

// ============================================================================
// Persistent Database & SQLite Export Endpoints
// ============================================================================

// Database engine status and stats
app.get('/api/db/status', (req, res) => {
  const data = dbStore.getData();
  res.json({
    status: 'connected',
    driver: data.meta.driver,
    version: data.meta.version,
    persistenceFile: data.meta.persistenceFile,
    createdAt: data.meta.createdAt,
    lastSavedAt: data.meta.lastSavedAt,
    recordsCount: data.meta.recordsCount,
    auditLogCount: data.auditLogs.length,
  });
});

// Fetch all database records in a single payload for fast boot
app.get('/api/db/all', (req, res) => {
  const data = dbStore.getData();
  res.json({
    family: data.family,
    occasions: data.occasions,
    members: data.members,
    people: data.people,
    lineageMembers: data.lineageMembers,
    users: Object.values(data.users),
    currentUser: data.users['user_bhushan_01'] || null,
    meta: data.meta,
  });
});

// Reset database to initial seed data
app.post('/api/db/reset', (req, res) => {
  const refreshed = dbStore.resetToDefaults();
  res.json({
    success: true,
    message: 'Database reset to default seed records successfully',
    recordsCount: refreshed.meta.recordsCount,
  });
});

// SQLite SQL Dump / DDL export
app.get('/api/db/export/sqlite-sql', (req, res) => {
  const sqlContent = dbStore.generateSqliteDump();
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="kulloop_database_sqlite.sql"');
  res.send(sqlContent);
});

// Family Profile Endpoints
app.get('/api/family', (req, res) => {
  const data = dbStore.getData();
  res.json(data.family);
});

// Reminder Automation Endpoint
app.post('/api/reminders/trigger', async (req, res) => {
  try {
    const logs = await runReminderWorker();
    res.json({ success: true, message: 'Reminder worker triggered successfully.', logs });
  } catch (error) {
    console.error('Error triggering reminder worker:', error);
    res.status(500).json({ error: 'Failed to trigger reminder worker.' });
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

app.put('/api/family', (req, res) => {
  const updatedFamily = req.body;
  if (!updatedFamily || !updatedFamily.name) {
    return res.status(400).json({ error: 'Valid family object required' });
  }
  const updated = dbStore.save((draft) => {
    draft.family = { ...draft.family, ...updatedFamily };
  }, 'UPDATE_FAMILY', 'FAMILY', updatedFamily.id || 'fam_joshi_01');

  res.json({ success: true, family: updated.family });
});

// Occasions Endpoints
app.get('/api/occasions', (req, res) => {
  const data = dbStore.getData();
  res.json(data.occasions);
});

app.post('/api/occasions', (req, res) => {
  const newOccasion = req.body;
  if (!newOccasion || !newOccasion.title) {
    return res.status(400).json({ error: 'Occasion title is required' });
  }
  if (!newOccasion.id) {
    newOccasion.id = `occ_${Date.now()}`;
  }
  dbStore.save((draft) => {
    draft.occasions.unshift(newOccasion);
  }, 'ADD_OCCASION', 'OCCASION', newOccasion.id);

  res.status(201).json({ success: true, occasion: newOccasion });
});

app.put('/api/occasions/:id', (req, res) => {
  const id = req.params.id;
  const updates = req.body;
  let updatedOccasion: any = null;

  dbStore.save((draft) => {
    const idx = draft.occasions.findIndex((o) => o.id === id);
    if (idx !== -1) {
      draft.occasions[idx] = { ...draft.occasions[idx], ...updates, id };
      updatedOccasion = draft.occasions[idx];
    }
  }, 'UPDATE_OCCASION', 'OCCASION', id);

  if (!updatedOccasion) {
    return res.status(404).json({ error: 'Occasion not found' });
  }
  res.json({ success: true, occasion: updatedOccasion });
});

app.delete('/api/occasions/:id', (req, res) => {
  const id = req.params.id;
  dbStore.save((draft) => {
    draft.occasions = draft.occasions.filter((o) => o.id !== id);
  }, 'DELETE_OCCASION', 'OCCASION', id);

  res.json({ success: true, message: `Occasion ${id} deleted` });
});

app.patch('/api/occasions/:id/toggle-confirm', (req, res) => {
  const id = req.params.id;
  let updatedOccasion: any = null;

  dbStore.save((draft) => {
    const occ = draft.occasions.find((o) => o.id === id);
    if (occ) {
      occ.isConfirmed = !occ.isConfirmed;
      if (occ.occurrence2027) {
        occ.occurrence2027.isVerified = occ.isConfirmed;
      }
      updatedOccasion = occ;
    }
  }, 'TOGGLE_CONFIRM_OCCASION', 'OCCASION', id);

  if (!updatedOccasion) {
    return res.status(404).json({ error: 'Occasion not found' });
  }
  res.json({ success: true, occasion: updatedOccasion });
});

app.patch('/api/occasions/:id/performed', (req, res) => {
  const id = req.params.id;
  const { notes, performedBy } = req.body || {};
  let updatedOccasion: any = null;

  dbStore.save((draft) => {
    const occ = draft.occasions.find((o) => o.id === id);
    if (occ) {
      const nextState = !occ.isPerformed;
      occ.isPerformed = nextState;
      if (nextState) {
        occ.performedAt = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        occ.performedBy = performedBy || 'The Joshi Family';
        occ.performedNotes = notes;
      } else {
        occ.performedAt = undefined;
        occ.performedBy = undefined;
        occ.performedNotes = undefined;
      }
      updatedOccasion = occ;
    }
  }, 'TOGGLE_PERFORMED_OCCASION', 'OCCASION', id);

  if (!updatedOccasion) {
    return res.status(404).json({ error: 'Occasion not found' });
  }
  res.json({ success: true, occasion: updatedOccasion });
});

// Memory Photo Endpoints
app.post('/api/occasions/:id/photos', (req, res) => {
  const id = req.params.id;
  const photo = req.body;
  if (!photo || !photo.url) {
    return res.status(400).json({ error: 'Photo URL is required' });
  }
  if (!photo.id) {
    photo.id = `photo_${Date.now()}`;
  }
  if (!photo.uploadedAt) {
    photo.uploadedAt = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  let updatedOccasion: any = null;
  dbStore.save((draft) => {
    const occ = draft.occasions.find((o) => o.id === id);
    if (occ) {
      if (!occ.memoryPhotos) occ.memoryPhotos = [];
      occ.memoryPhotos.push(photo);
      updatedOccasion = occ;
    }
  }, 'ADD_MEMORY_PHOTO', 'OCCASION', id);

  if (!updatedOccasion) {
    return res.status(404).json({ error: 'Occasion not found' });
  }
  res.json({ success: true, occasion: updatedOccasion, photo });
});

app.delete('/api/occasions/:id/photos/:photoId', (req, res) => {
  const { id, photoId } = req.params;
  let updatedOccasion: any = null;

  dbStore.save((draft) => {
    const occ = draft.occasions.find((o) => o.id === id);
    if (occ && occ.memoryPhotos) {
      occ.memoryPhotos = occ.memoryPhotos.filter((p) => p.id !== photoId);
      updatedOccasion = occ;
    }
  }, 'DELETE_MEMORY_PHOTO', 'OCCASION', id);

  if (!updatedOccasion) {
    return res.status(404).json({ error: 'Occasion not found' });
  }
  res.json({ success: true, occasion: updatedOccasion });
});

// Members Endpoints
app.get('/api/members', (req, res) => {
  const data = dbStore.getData();
  res.json(data.members);
});

app.post('/api/members', (req, res) => {
  const member = req.body;
  if (!member || !member.name) {
    return res.status(400).json({ error: 'Member name is required' });
  }
  if (!member.id) {
    member.id = `mem_${Date.now()}`;
  }

  dbStore.save((draft) => {
    draft.members.push(member);
  }, 'ADD_MEMBER', 'MEMBER', member.id);

  res.status(201).json({ success: true, member });
});

app.put('/api/members/:id', (req, res) => {
  const id = req.params.id;
  const updates = req.body;
  let updatedMember: any = null;

  dbStore.save((draft) => {
    const idx = draft.members.findIndex((m) => m.id === id);
    if (idx !== -1) {
      draft.members[idx] = { ...draft.members[idx], ...updates, id };
      updatedMember = draft.members[idx];
    }
  }, 'UPDATE_MEMBER', 'MEMBER', id);

  if (!updatedMember) {
    return res.status(404).json({ error: 'Member not found' });
  }
  res.json({ success: true, member: updatedMember });
});

app.delete('/api/members/:id', (req, res) => {
  const id = req.params.id;
  dbStore.save((draft) => {
    draft.members = draft.members.filter((m) => m.id !== id);
  }, 'DELETE_MEMBER', 'MEMBER', id);

  res.json({ success: true, message: `Member ${id} removed` });
});

// Lineage Endpoints
app.get('/api/lineage', (req, res) => {
  const data = dbStore.getData();
  res.json(data.lineageMembers);
});

app.put('/api/lineage/:id', (req, res) => {
  const id = req.params.id;
  const updates = req.body;
  let updatedLineageMember: any = null;

  dbStore.save((draft) => {
    const idx = draft.lineageMembers.findIndex((m) => m.id === id);
    if (idx !== -1) {
      draft.lineageMembers[idx] = { ...draft.lineageMembers[idx], ...updates, id };
      updatedLineageMember = draft.lineageMembers[idx];
    }
  }, 'UPDATE_LINEAGE', 'LINEAGE', id);

  if (!updatedLineageMember) {
    return res.status(404).json({ error: 'Lineage member not found' });
  }
  res.json({ success: true, member: updatedLineageMember });
});

// User Profiles (Persistent in storage file)
app.get('/api/users', (req, res) => {
  const data = dbStore.getData();
  res.json(Object.values(data.users));
});

app.get('/api/users/:uid', (req, res) => {
  const data = dbStore.getData();
  const profile = data.users[req.params.uid];
  if (!profile) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(profile);
});

app.post('/api/users', (req, res) => {
  const profileData = req.body;
  if (!profileData || !profileData.uid || !profileData.username) {
    return res.status(400).json({ error: 'Missing required profile fields (uid, username)' });
  }

  let savedProfile: any = null;
  dbStore.save((draft) => {
    const existing = draft.users[profileData.uid] || {};
    draft.users[profileData.uid] = {
      ...existing,
      ...profileData,
      updatedAt: new Date().toISOString(),
    };
    savedProfile = draft.users[profileData.uid];
  }, 'SAVE_USER_PROFILE', 'USER', profileData.uid);

  res.json({ success: true, profile: savedProfile });
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
  const { messages, userInterests, model: requestedModel } = req.body;

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

  const systemInstruction = `You are the KulLoop Heritage & Tithi Assistant (संस्कार व कुलधर्म मार्गदर्शक), an expert, respectful, and calm guide for Indian family traditions, panchang calculations, ancestral shraddha rites, tithi birthdays, and festival observances.
Key principles:
1. Tone: Respectful, calm, dignified, culturally authentic. Never sell fear, avoid astrology predictions or dosha warnings.
2. Tithi & Calendar: Explain the difference between Amanta (common in Maharashtra, Gujarat, South India) and Purnimanta (North India). Mention that tithis depend on local sunrise (उदयातिथि).
3. Rituals & Shraddhas: Explain the significance of Mahalaya (Pitru Paksha), annual shraddha, Gau-grasa (cow offering), and practical items to keep ready (darbha grass, black sesame/til).
4. Community & Passions: If the user has specific passions or interests (${userInterests ? userInterests.join(', ') : 'Family Heritage'}), highlight connections to relevant traditions and suggest meaningful ways to engage with family and community members.
5. Language: You can respond in English, Hindi, or Marathi depending on what the user asks or uses.`;

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

// Vite middleware in dev or static serving in production
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

  app.listen(port, '0.0.0.0', () => {
    console.log(`KulLoop server running on port ${port}`);
  });
}

startServer();
