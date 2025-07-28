// Initialisiere Supabase client
// ERSETZE DIESE MIT DEINEN EIGENEN WERTEN VON SUPABASE!
const SUPABASE_URL = 'https://jqcuavnhmubhdawexnba.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxY3Vhdm5obXViaGRhd2V4bmJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MDM3NDIsImV4cCI6MjA2OTI3OTc0Mn0.lInGzdtI6PZybXaF90n2_gXJnaEd_FeL91ONYrgkjbg';


const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const eventCardsContainer = document.getElementById('event-cards-container');
const bucketlistItemsList = document.getElementById('bucketlist-items');
const filterMonth = document.getElementById('filter-month');
const sortCost = document.getElementById('sort-cost');
const filterLocation = document.getElementById('filter-location');
const applyFiltersBtn = document.getElementById('apply-filters');

let allEvents = []; // Speichert alle Events nach dem ersten Laden

// Funktion zum Laden der Events von Supabase
async function loadEvents() {
    const { data, error } = await _supabase
        .from('events')
        .select('*')
        .order('datum', { ascending: true }); // Events nach Datum sortieren

    if (error) {
        console.error('Fehler beim Laden der Events:', error);
        return [];
    }
    return data;
}

// Funktion zum Laden der Bucketlist-Items
async function loadBucketlistItems() {
    const { data, error } = await _supabase
        .from('bucketlist_items')
        .select('*');

    if (error) {
        console.error('Fehler beim Laden der Bucketlist-Items:', error);
        return [];
    }
    return data;
}

// Funktion zum Rendern der Events
function renderEvents(eventsToRender) {
    eventCardsContainer.innerHTML = ''; // Vorhandene Karten leeren

    if (eventsToRender.length === 0) {
        eventCardsContainer.innerHTML = '<p>Keine Events gefunden, die den Filtern entsprechen.</p>';
        return;
    }

    eventsToRender.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.classList.add('event-card');

        // Datum für die Anzeige formatieren (z.B. "12.07.2025")
        const eventDate = new Date(event.datum);
        const formattedDate = eventDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

        eventCard.innerHTML = `
            <h3>${event.veranstaltung}</h3>
            <p><strong>Datum:</strong> ${formattedDate}</p>
            <p><strong>Uhrzeit:</strong> ${event.uhrzeit}</p>
            ${event.einlass ? `<p><strong>Einlass:</strong> ${event.einlass}</p>` : ''}
            ${event.wann_hin ? `<p><strong>Wann möchte ich hin:</strong> ${event.wann_hin}</p>` : ''}
            <p><strong>Kosten:</strong> ${event.kosten}</p>
            ${event.link ? `<p><a href="${event.link}" target="_blank" class="event-link">Weitere Infos</a></p>` : ''}
            <p><strong>Ort:</strong> ${event.ort}</p>
            ${event.zusatzinfo ? `<p><strong>Zusatzinfo:</strong> ${event.zusatzinfo}</p>` : ''}

            <div class="response-options">
                <p>Dein Interesse:</p>
                <label>
                    <input type="radio" name="response-${event.id}" value="dabei"> Dabei!
                </label>
                <label>
                    <input type="radio" name="response-${event.id}" value="keine_zeit"> Nein - keine Zeit
                </label>
                <label>
                    <input type="radio" name="response-${event.id}" value="kein_interesse"> Nein - kein Interesse
                </label>
            </div>
        `;
        eventCardsContainer.appendChild(eventCard);

        // Event Listener für Radio-Buttons (zur späteren Speicherung in DB)
        const radioButtons = eventCard.querySelectorAll(`input[name="response-${event.id}"]`);
        radioButtons.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const response = e.target.value;
                console.log(`Event ID: ${event.id}, Antwort: ${response}`);
                // Hier könnte die Logik zum Speichern der Antwort in Supabase implementiert werden.
                // Dafür bräuchtest du eine weitere Tabelle (z.B. 'user_responses')
                // mit Feldern für event_id, user_id (wenn du Nutzer hast), und response.
            });
        });
    });
}

// Funktion zum Rendern der Bucketlist-Items
function renderBucketlistItems(items) {
    bucketlistItemsList.innerHTML = '';
    items.forEach(item => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <input type="checkbox" id="bucket-${item.id}" ${item.abgehakt ? 'checked' : ''}>
            <label for="bucket-${item.id}">${item.name}</label>
        `;
        bucketlistItemsList.appendChild(listItem);

        const checkbox = listItem.querySelector(`#bucket-${item.id}`);
        checkbox.addEventListener('change', async () => {
            const { error } = await _supabase
                .from('bucketlist_items')
                .update({ abgehakt: checkbox.checked })
                .eq('id', item.id);
            if (error) {
                console.error('Fehler beim Aktualisieren der Bucketlist:', error);
            }
        });
    });
}

// Filter- und Sortierlogik anwenden
applyFiltersBtn.addEventListener('click', () => {
    let filteredEvents = [...allEvents]; // Kopie der ursprünglichen Liste

    // Nach Monat filtern
    const selectedMonth = filterMonth.value;
    if (selectedMonth) {
        filteredEvents = filteredEvents.filter(event => {
            const eventDate = new Date(event.datum);
            return (eventDate.getMonth() + 1).toString().padStart(2, '0') === selectedMonth;
        });
    }

    // Nach Ort filtern (Case-insensitive)
    const locationQuery = filterLocation.value.toLowerCase().trim();
    if (locationQuery) {
        filteredEvents = filteredEvents.filter(event =>
            event.ort.toLowerCase().includes(locationQuery)
        );
    }

    // Nach Kosten sortieren
    const sortOrder = sortCost.value;
    if (sortOrder === 'asc') {
        filteredEvents.sort((a, b) => {
            const costA = parseFloat(a.kosten.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
            const costB = parseFloat(b.kosten.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
            return costA - costB;
        });
    } else if (sortOrder === 'desc') {
        filteredEvents.sort((a, b) => {
            const costA = parseFloat(a.kosten.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
            const costB = parseFloat(b.kosten.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
            return costB - costA;
        });
    }

    renderEvents(filteredEvents);
});

// Initiales Laden und Rendern der Daten
document.addEventListener('DOMContentLoaded', async () => {
    allEvents = await loadEvents();
    renderEvents(allEvents);

    const bucketlistData = await loadBucketlistItems();
    renderBucketlistItems(bucketlistData);
});

// Beispiel: Daten in Supabase einfügen (einmalig oder über Admin-Panel)
// Du kannst dies auskommentieren, sobald deine Daten in der DB sind.
/*
async function addInitialData() {
    const initialEvents = [
        {
            veranstaltung: "3. Grazer Straßenmusik Festival",
            datum: "2025-07-12",
            uhrzeit: "11:00 - 21:00 Uhr",
            wann_hin: "Ca. 17:00 Uhr",
            kosten: "freier Eintritt",
            link: "https://strassenmusik-festival.at/programm/programm-liste/",
            ort: "Graz"
        },
        {
            veranstaltung: "Beatsteaks",
            datum: "2025-08-03",
            uhrzeit: "20:00 Uhr",
            einlass: "19:00 Uhr",
            kosten: "Preis auf Anfrage", // Beispiel: Echter Preis wäre besser
            link: "https://spielstaetten.buehnen-graz.com/event/179767281/",
            ort: "Graz, Orpheum"
        },
        {
            veranstaltung: "Langer Samstag im Graz Museum Schlossberg",
            datum: "2025-07-19",
            uhrzeit: "18:00 Uhr",
            einlass: "22:00 Uhr",
            kosten: "freier Eintritt",
            link: "",
            ort: "Schlossberg Museum Graz",
            zusatzinfo: "bei schlechtem Wetter entfällt die Veranstaltung"
        },
        {
            veranstaltung: "Drum & Bass Open Air 2025",
            datum: "2025-09-13",
            uhrzeit: "15:00 Uhr",
            kosten: "ab 59,82€",
            link: "https://www.eventbrite.at/e/ione-drum-bass-open-air-kasematten-graz-tickets-1415391266379",
            ort: "Schlossbergbühne Kasematten",
            zusatzinfo: "15+ HOURS of high-quality DRUM & BASS..."
        },
        {
            veranstaltung: "La Strada Pre-Opening",
            datum: "2025-07-24",
            uhrzeit: "18:00 Uhr",
            einlass: "17:00 Uhr",
            kosten: "Info folgt", // Beispiel
            link: "",
            ort: "Café Arravané, Merkur Campus"
        },
        {
            veranstaltung: "Ö3 Silent Cinema Open Air Kino Tour 2025",
            datum: "2025-08-26",
            uhrzeit: "20:00 Uhr",
            einlass: "18:30:00 Uhr",
            kosten: "9€",
            link: "",
            ort: "Schlossbergbühne Kasematten",
            zusatzinfo: "Mufasa - der König der Löwen"
        },
        {
            veranstaltung: "Mama geht Tanzen",
            datum: "2025-09-20",
            uhrzeit: "20:00 - 23:00 Uhr",
            einlass: "19:00 Uhr",
            kosten: "ab 13€",
            link: "",
            zusatzinfo: "nur für Frauen; Charts / 80's / 90's / Hip Hop"
        }
    ];

    const initialBucketlist = [
        { name: "Europapark", abgehakt: false }
    ];

    const { data: eventsData, error: eventsError } = await _supabase.from('events').insert(initialEvents);
    if (eventsError) console.error("Fehler beim Einfügen der Events:", eventsError);
    else console.log("Events erfolgreich eingefügt:", eventsData);

    const { data: bucketlistData, error: bucketlistError } = await _supabase.from('bucketlist_items').insert(initialBucketlist);
    if (bucketlistError) console.error("Fehler beim Einfügen der Bucketlist-Items:", bucketlistError);
    else console.log("Bucketlist-Items erfolgreich eingefügt:", bucketlistData);
}
*/

// Führe dies NUR einmal aus, um die Initialdaten einzufügen
// addInitialData();
