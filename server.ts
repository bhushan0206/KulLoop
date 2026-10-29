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

// In-memory store for user profiles if cloud Firestore credentials are not yet provisioned
const memoryProfiles = new Map<string, any>();

// Seed a few community profiles so users can connect with others with similar passions!
const initialCommunityProfiles = [
  {
    uid: 'comm_meera_01',
    username: 'meera_pune',
    displayName: 'Meera Kulkarni',
    email: 'meera.k@example.com',
    photoURL: '/src/assets/images/kulloop_avatar_elder_1793303629841.jpg',
    bio: 'Preserving our family’s Rigvedic traditions, Ganpati sthapana rituals, and Aaji’s heirloom recipes in Pune.',
    interests: ['Family Heritage', 'Ancestral Rites (श्राद्ध)', 'Marathi Traditions', 'Panchang & Astronomy'],
    homeLocation: 'Pune, Maharashtra',
    tradition: 'Amanta (Chitpavan)',
    createdAt: new Date().toISOString(),
  },
  {
    uid: 'comm_arun_02',
    username: 'arun_diaspora',
    displayName: 'Arun Deshpande',
    email: 'arun.d@example.com',
    photoURL: '',
    bio: 'Living in Toronto, coordinating Pitru Paksha and tithi observances for parents back home in Nagpur.',
    interests: ['Diaspora Connections', 'Ancestral Rites (श्राद्ध)', 'Genealogy & Gotra', 'Vrat & Fasting'],
    homeLocation: 'Nagpur / Toronto',
    tradition: 'Amanta (Deshastha)',
    createdAt: new Date().toISOString(),
  },
  {
    uid: 'comm_shrikant_03',
    username: 'pt_shrikant',
    displayName: 'Pt. Shrikant Joshi',
    email: 'shrikant.j@example.com',
    photoURL: '',
    bio: 'Vedic scholar and panchang consultant. Passionate about correct tithi calculations and helping families understand rituals.',
    interests: ['Panchang & Astronomy', 'Ancestral Rites (श्राद्ध)', 'Temple Architecture', 'Devotional Music'],
    homeLocation: 'Varanasi / Pune',
    tradition: 'Vedic Panchang Reviewer',
    createdAt: new Date().toISOString(),
  },
  {
    uid: 'comm_priya_04',
    username: 'priya_heritage',
    displayName: 'Priya Sharma',
    email: 'priya.s@example.com',
    photoURL: '',
    bio: 'Documenting our family history and Gotra roots across generations. Love learning about solar vs lunar celebrations.',
    interests: ['Genealogy & Gotra', 'Family Heritage', 'Devotional Music', 'Festivals & Vrats'],
    homeLocation: 'Jaipur, Rajasthan',
    tradition: 'Purnimanta',
    createdAt: new Date().toISOString(),
  }
];

initialCommunityProfiles.forEach((p) => memoryProfiles.set(p.uid, p));

// User Profile Endpoints
app.get('/api/users', (req, res) => {
  const list = Array.from(memoryProfiles.values());
  res.json(list);
});

app.get('/api/users/:uid', (req, res) => {
  const profile = memoryProfiles.get(req.params.uid);
  if (!profile) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(profile);
});

app.post('/api/users', (req, res) => {
  const data = req.body;
  if (!data || !data.uid || !data.username) {
    return res.status(400).json({ error: 'Missing required profile fields (uid, username)' });
  }
  const existing = memoryProfiles.get(data.uid) || {};
  const updated = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  memoryProfiles.set(data.uid, updated);
  res.json({ success: true, profile: updated });
});

// Gemini Multi-Turn Heritage Assistant API
app.post('/api/gemini/chat', async (req, res) => {
  const { messages, userInterests } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY is not configured in the environment.'
    });
  }

  try {
    const ai = new GoogleGenAI();
    
    // Format conversation history for @google/genai
    const formattedContents = messages.map((m: { role: string; text: string }) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));

    const systemInstruction = `You are the KulLoop Heritage & Tithi Assistant (संस्कार व कुलधर्म मार्गदर्शक), an expert, respectful, and calm guide for Indian family traditions, panchang calculations, ancestral shraddha rites, tithi birthdays, and festival observances.
Key principles:
1. Tone: Respectful, calm, dignified, culturally authentic. Never sell fear, avoid astrology predictions or dosha warnings.
2. Tithi & Calendar: Explain the difference between Amanta (common in Maharashtra, Gujarat, South India) and Purnimanta (North India). Mention that tithis depend on local sunrise (उदयातिथि).
3. Rituals & Shraddhas: Explain the significance of Mahalaya (Pitru Paksha), annual shraddha, Gau-grasa (cow offering), and practical items to keep ready (darbha grass, black sesame/til).
4. Community & Passions: If the user has specific passions or interests (${userInterests ? userInterests.join(', ') : 'Family Heritage'}), highlight connections to relevant traditions and suggest meaningful ways to engage with family and community members.
5. Language: You can respond in English, Hindi, or Marathi depending on what the user asks or uses.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const replyText = response.text || 'I am here to help you with your family tithis, traditions, and heritage.';
    res.json({ reply: replyText });
  } catch (err: any) {
    console.error('Error in /api/gemini/chat:', err);
    res.status(500).json({
      error: err?.message || 'Failed to generate response from Gemini Heritage Assistant'
    });
  }
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
