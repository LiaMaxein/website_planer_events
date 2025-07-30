// Definiere die Basis-URL deines Backends
// Wenn dein Frontend und Backend auf demselben Server laufen, kannst du relative Pfade verwenden.
// Für lokale Entwicklung ist 'http://localhost:3000' (oder den Port, den du im Backend festgelegt hast) korrekt.
// Beim Deployment musst du dies auf die URL deines deployten Backends ändern!
// const BACKEND_BASE_URL = 'http://localhost:3000';
const BACKEND_BASE_URL = 'https://website-planer-events.vercel.app';

const eventCardsContainer = document.getElementById('event-cards-container');
const bucketlistItemsList = document.getElementById('bucketlist-items');
const filterMonth = document.getElementById('filter-month');
const sortCost = document.getElementById('sort-cost');
const filterLocation = document.getElementById('filter-location');
const applyFiltersBtn = document.getElementById('apply-filters');

let allEvents = []; // Speichert alle Events nach dem ersten Laden

// Funktion zum Laden der Events von deinem Backend
async function loadEvents() {
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/events`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Fehler beim Laden der Events vom Backend:', error);
        return [];
    }
}

// Funktion zum Laden der Bucketlist-Items von deinem Backend
async function loadBucketlistItems() {
    try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/bucketlist`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Fehler beim Laden der Bucketlist-Items vom Backend:', error);
        return [];
    }
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
            ${event.tags && event.tags.length ? `<p><strong>Tags:</strong> ${event.tags.map(tag => '#' + tag).join(' ')}</p>` : ''}

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
            ${item.adresse ? `<div><strong>Adresse:</strong> ${item.adresse}</div>` : ''}
            ${item.website ? `<div><a href="${item.website}" target="_blank">Website</a></div>` : ''}
            ${item.tags && item.tags.length ? `<div><strong>Tags:</strong> ${item.tags.map(tag => '#' + tag).join(' ')}</div>` : ''}
            ${item.zusatzinfo ? `<div><strong>Zusatzinfo:</strong> ${item.zusatzinfo}</div>` : ''}
        `;
        bucketlistItemsList.appendChild(listItem);

        const checkbox = listItem.querySelector(`#bucket-${item.id}`);
        checkbox.addEventListener('change', async () => {
            const newStatus = checkbox.checked;
            try {
                const response = await fetch(`${BACKEND_BASE_URL}/api/bucketlist/${item.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ abgehakt: newStatus })
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                console.log(`Bucketlist item ${item.id} updated successfully.`);
            } catch (error) {
                console.error('Fehler beim Aktualisieren der Bucketlist im Backend:', error);
                // Optional: Checkbox zurücksetzen, wenn Fehler auftritt
                checkbox.checked = !newStatus;
            }
        });
    });
}

// Filter- und Sortierlogik anwenden (bleibt gleich, da sie auf allEvents operiert)
applyFiltersBtn.addEventListener('click', () => {
    let filteredEvents = [...allEvents]; // Kopie der ursprünglichen Liste

    // ... Filter- und Sortierlogik wie zuvor ...

    renderEvents(filteredEvents);
});

// Initiales Laden und Rendern der Daten
document.addEventListener('DOMContentLoaded', async () => {
    // Lade alle Events nur einmal initial
    allEvents = await loadEvents();
    renderEvents(allEvents); // Render die initial geladenen Events

    const bucketlistData = await loadBucketlistItems();
    renderBucketlistItems(bucketlistData);
});