"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/server.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const supabase_js_1 = require("@supabase/supabase-js"); // Importiere PostgrestResponse
dotenv_1.default.config(); // Lädt die Umgebungsvariablen aus .env
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use(express_1.default.json()); // Ermöglicht das Parsen von JSON im Request Body
// Supabase-Client für das Backend initialisieren
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
// CORS Optionen - DIESER BLOCK IST ENTSCHEIDEND
const allowedOrigins = [
    // HINWEIS: Ersetze 'https://DEIN-GITHUB-USERNAME.github.io/WEBSITE_PLANER_EVENTS'
    // durch die tatsächliche URL deines Frontends auf GitHub Pages,
    // sobald du deployst!
    'https://liamaxein.github.io/website_planer_events/',
    // Dies ist die Vercel-URL deines Backends, wie sie im Vercel Dashboard steht.
    // Füge diese URL hier ein, sobald du dein Backend erfolgreich auf Vercel deployt hast
    // und sie zum ersten Mal verwendest.
    // Beispiel: 'https://website-planer-events-xxxxxx.vercel.app',
    'https://website-planer-events-hlsqwd6pk-lia-maxeins-projects.vercel.app', // Deine Vercel Domain
    // --- LOKALE ENTWICKLUNGS-URLs ---
    'http://localhost:3000', // Für direkte Backend-Tests oder wenn Frontend vom selben localhost kommt
    'http://127.0.0.1:3000', // das ust die Cors Richtilinie die läuft
    'http://localhost:5500', // Häufiger Port für VS Code Live Server
    'http://127.0.0.1:5500', // Alternative für VS Code Live Server
    'http://localhost:8080', // Andere gängige lokale Server
    'http://127.0.0.1:8080' // Alternative für andere lokale Entwicklungsserver
];
const corsOptions = {
    // Explizite Typisierung für origin und callback hinzufügen
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            console.error('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    optionsSuccessStatus: 200
};
app.use((0, cors_1.default)(corsOptions));
// --- API-Endpunkte für Events ---
app.get('/api/events', async (req, res) => {
    console.log('Fetching events...');
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Setzt die Uhrzeit auf Mitternacht, um den gesamten heutigen Tag einzuschließen
    // --- HIER ENDET DER NEUE CODE ---

    const { data, error } = await supabase
        .from('events')
        .select('*')
        // --- HIER DIE NÄCHSTE ZEILE EINFÜGEN ---
        .gte('datum', today.toISOString().split('T')[0]) // Filtert Events, deren Datum >= heute ist
        .order('datum', { ascending: true }); // Diese Zeile ist möglicherweise schon da

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
    const { data, error } = await supabase
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
