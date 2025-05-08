document.addEventListener("DOMContentLoaded", function() {
    // Sprache erkennen
    const userLanguage = navigator.language || navigator.userLanguage;
    console.log("Erkannte Sprache:", userLanguage);

    // Übersetzungen basierend auf der erkannten Sprache
    const translations = {
        de: {
            title: "Standort-Tracker",
            buttonText: "Standort senden",
            statusDefault: "",
            locating: "Standort wird ermittelt...",
            geoNotSupported: "Geolocation wird von diesem Gerät nicht unterstützt.",
            locationSuccess: "Standort erfolgreich gesendet!",
            locationError: "Fehler bei der Standortermittlung:",
            sendError: "Fehler beim Senden des Standorts.",
        },
        en: {
            title: "Location Tracker",
            buttonText: "Send Location",
            statusDefault: "",
            locating: "Locating...",
            geoNotSupported: "Geolocation is not supported by this device.",
            locationSuccess: "Location successfully sent!",
            locationError: "Error getting location:",
            sendError: "Error sending location.",
        }
    };

    // Wähle die Übersetzungen basierend auf der Sprache oder falle auf Englisch zurück
    const lang = userLanguage.startsWith("de") ? "de" : "en";
    const t = translations[lang];

    // HTML-Inhalte übersetzen
    document.title = t.title;
    document.querySelector("h1").textContent = t.title;
    document.getElementById("sendLocationBtn").textContent = t.buttonText;
    document.getElementById("status").textContent = t.statusDefault;

    // Event-Listener für den Button
    document.getElementById("sendLocationBtn").addEventListener("click", function() {
        const statusElement = document.getElementById("status");
        statusElement.textContent = t.locating;

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(success, error);
        } else {
            statusElement.textContent = t.geoNotSupported;
            sendErrorToAirtable(t.geoNotSupported);
        }

        function success(position) {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            statusElement.textContent = `(${latitude}, ${longitude})`;

            // `statusElement` wird hier als Argument übergeben
            sendLocationToAirtable(latitude, longitude, statusElement);
        }

        function error(err) {
            statusElement.textContent = `${t.locationError} ${err.message}`;
            sendErrorToAirtable(`${t.locationError} ${err.message}`);
        }
    });

    function sendLocationToAirtable(lat, long, statusElement) {
        const airtableApiKey = 'patKGZansVOgQzmoO.cbba17752195e08b14aef61da396fbdeffeb5acfe58eaacf94dbdbe9f7d7fdbc'; // Airtable API-Schlüssel
        const airtableBaseId = 'appECl30m16Rv1iTS'; // Airtable Base-ID
        const airtableTableName = 'currentLocation'; // Airtable Tabellenname
        const recordId = 'rec41O8E9RVes5BvP'; // ID des Datensatzes

        const url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}/${recordId}`;
        const data = {
            fields: {
                "Latitude": lat,
                "Longitude": long,
                "Error": "" // Lösche Fehler, wenn die Koordinaten erfolgreich sind
            }
        };

        fetch(url, {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${airtableApiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errData => {
                    throw new Error(`Fehler ${response.status}: ${errData.error.message}`);
                });
            }
            return response.json();
        })
        .then(data => {
            // `statusElement` wird hier aktualisiert
            statusElement.textContent = t.locationSuccess;
        })
        .catch(error => {
            statusElement.textContent = t.sendError;
            console.error("Error:", error);
        });
    }

    function sendErrorToAirtable(errorMessage) {
        const airtableApiKey = 'patKGZansVOgQzmoO.cbba17752195e08b14aef61da396fbdeffeb5acfe58eaacf94dbdbe9f7d7fdbc'; // Airtable API-Schlüssel
        const airtableBaseId = 'appECl30m16Rv1iTS'; // Airtable Base-ID
        const airtableTableName = 'currentLocation'; // Airtable Tabellenname
        const recordId = 'rec41O8E9RVes5BvP'; // ID des Datensatzes

        const url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}/${recordId}`;
        const data = {
            fields: {
                "Error": errorMessage,
                "Latitude": "", // Leeren, da keine Koordinaten ermittelt wurden
                "Longitude": "" // Leeren, da keine Koordinaten ermittelt wurden
            }
        };

        fetch(url, {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${airtableApiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errData => {
                    throw new Error(`Fehler ${response.status}: ${errData.error.message}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log("Fehlermeldung erfolgreich an Airtable gesendet:", data);
        })
        .catch(error => {
            console.error("Fehler beim Senden der Fehlermeldung:", error);
        });
    }
});
