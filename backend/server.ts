// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient, PostgrestResponse } from '@supabase/supabase-js'; // Importiere PostgrestResponse

dotenv.config(); // Lädt die Umgebungsvariablen aus .env

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // Ermöglicht das Parsen von JSON im Request Body

// Supabase-Client für das Backend initialisieren
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY as string;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CORS Optionen - DIESER BLOCK IST ENTSCHEIDEND
const allowedOrigins = [
  // GitHub Pages URL (ohne Repository-Name)
  'https://liamaxein.github.io',

  // Vercel Backend URL
  'https://website-planer-events.vercel.app',
  'https://website-planer-events-hlsqwd6pk-lia-maxeins-projects.vercel.app',

  // --- LOKALE ENTWICKLUNGS-URLs ---
  'http://localhost:3000',    // Für direkte Backend-Tests oder wenn Frontend vom selben localhost kommt
  'http://127.0.0.1:3000',    // das ust die Cors Richtilinie die läuft
  'http://localhost:5500',    // Häufiger Port für VS Code Live Server
  'http://127.0.0.1:5500',    // Alternative für VS Code Live Server
  'http://localhost:8080',    // Andere gängige lokale Server
  'http://127.0.0.1:8080'     // Alternative für andere lokale Entwicklungsserver
];

const corsOptions = {
  // Explizite Typisierung für origin und callback hinzufügen
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    console.log('CORS check for origin:', origin);
    console.log('Allowed origins:', allowedOrigins);
    
    if (!origin || allowedOrigins.includes(origin)) {
      console.log('CORS allowed for origin:', origin);
      callback(null, true);
    } else {
      console.error('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200,
  credentials: true
};

app.use(cors(corsOptions));

// Test endpoint for CORS debugging
app.get('/api/test', (req, res) => {
  console.log('Test endpoint hit');
  console.log('Origin:', req.headers.origin);
  console.log('Method:', req.method);
  res.json({ message: 'CORS test successful', origin: req.headers.origin });
});

// --- API-Endpunkte für Events ---
app.get('/api/events', async (req, res) => {
  console.log('Fetching events...');
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('datum', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

// --- API-Endpunkte für Bucketlist ---
app.get('/api/bucketlist', async (req, res) => {
  console.log('Fetching bucketlist items...');
  const { data, error } = await supabase
    .from('bucketlist_items')
    .select('*');

  if (error) {
    console.error('Error fetching bucketlist items:', error);
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

// --- Endpunkt zum Aktualisieren der Bucketlist (für den Checkbox-Status) ---
app.put('/api/bucketlist/:id', async (req, res) => {
  const { id } = req.params;
  const { abgehakt } = req.body;

  if (typeof abgehakt !== 'boolean') {
    return res.status(400).json({ error: 'Invalid "abgehakt" value. Must be boolean.' });
  }

  console.log(`Updating bucketlist item ${id} to abgehakt: ${abgehakt}`);
  // Beim Update gibt Supabase ein PostgrestResponse-Objekt zurück,
  // dessen 'data'-Eigenschaft ein Array von den aktualisierten Datensätzen oder null sein kann.
  const { data, error }: PostgrestResponse<any> = await supabase
    .from('bucketlist_items')
    .update({ abgehakt: abgehakt })
    .eq('id', id)
    .select(); // Füge .select() hinzu, um die aktualisierten Daten zurückzubekommen

  if (error) {
    console.error('Error updating bucketlist item:', error);
    return res.status(500).json({ error: error.message });
  }

  // Überprüfe, ob Daten vorhanden sind und das Array nicht leer ist
  if (!data || data.length === 0) {
    return res.status(404).json({ error: 'Bucketlist item not found or no change occurred.' });
  }
  res.json(data[0]); // Sende das erste aktualisierte Objekt zurück
});


// Starte den Server
app.listen(port, () => {
  console.log(`Backend läuft auf http://localhost:${port}`);
  console.log(`Frontend muss Anfragen an http://localhost:${port} senden.`);
});

export default app;