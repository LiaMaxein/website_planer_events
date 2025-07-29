// src/server.ts
import express from 'express';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors'; // Importiere cors

dotenv.config(); // Lädt die Umgebungsvariablen aus .env

const app = express();
const port = process.env.PORT || 3000;

// Konfiguriere CORS, um Anfragen von deinem Frontend zu erlauben
// ERSETZE 'http://localhost:5500' mit der tatsächlichen URL deines Frontends,
// wenn du es deployt hast (z.B. deine GitHub Pages URL).
const corsOptions = {
  origin: 'http://localhost:5500', // Oder die URL, von der dein Frontend geladen wird (z.B. Live Server in VS Code)
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));
app.use(express.json()); // Ermöglicht das Parsen von JSON im Request Body

// Supabase-Client für das Backend initialisieren
// Hier verwenden wir den service_role Key, da er alle RLS umgeht
// und nur vom Backend aus aufgerufen wird.
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY as string;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

// --- Beispiel-Endpunkt zum Aktualisieren der Bucketlist (für den Checkbox-Status) ---
// Für eine produktive App würdest du hier natürlich mehr Validierung und ggf. Authentifizierung benötigen.
app.put('/api/bucketlist/:id', async (req, res) => {
  const { id } = req.params;
  const { abgehakt } = req.body;

  if (typeof abgehakt !== 'boolean') {
    return res.status(400).json({ error: 'Invalid "abgehakt" value. Must be boolean.' });
  }

  console.log(`Updating bucketlist item ${id} to abgehakt: ${abgehakt}`);
  const { data, error } = await supabase
    .from('bucketlist_items')
    .update({ abgehakt: abgehakt })
    .eq('id', id);

  if (error) {
    console.error('Error updating bucketlist item:', error);
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});


// Starte den Server
app.listen(port, () => {
  console.log(`Backend läuft auf http://localhost:${port}`);
  console.log(`Frontend muss Anfragen an http://localhost:${port} senden.`);
});