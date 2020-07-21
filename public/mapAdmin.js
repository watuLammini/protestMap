// @formatter:off
// @formatter:on

// == Konstanten ==
const API_URL = 'http://localhost:3000/api';
const ICON_SETTINGS = {
    iconUrl: './assets/Logo-Hand.png',
    iconSize: [45, 62], // size of the icon
    // iconAnchor: [22, 34], // point of the icon which will correspond to marker's location
    popupAnchor: [0, -20] // point from which the popup should open relative to the iconAnchor
};

document.addEventListener('DOMContentLoaded', () => {

/*// Bereich der auswählbaren Jahre
    const START_YEAR = 1000;
    const END_YEAR = 1850;
// Alle x Jahre gibt es Labels/pips
    const YEAR_SCALE_STEP = 100;

    let yearRange = [START_YEAR + '-00-00', END_YEAR + '-00-00'];*/

    // const QUERY_PARAMS = new URLSearchParams(window.location.search);
    // const CONFIRMED = !QUERY_PARAMS.has('unconfirmed');
    const CONFIRMED = true;

    /**
     * Speichert alle Marker mit Namen des Ortes als Key
     * @type {Map<String, Object>}
     */
    let markers = new Map();
// R: Initialisiere die Karte mit gegebenem Mittelpunkt (München) und Zoomstufe
    const map = L.map('map').setView([48.142992, 11.573495], 5);
// R: Füge die OpenStreetMap tiles hinzu
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

// Update der Karte bei Bewegung, momentan nicht nötig
// map.on("moveend", () => { });

/*
// == SLIDER ==
// Hole das container-div
    const slider = $('#slider')[0];
// Die Beschriftung des Sliders
    let scaleValues = [];
    for (value = START_YEAR; value < END_YEAR; value += YEAR_SCALE_STEP) {
        scaleValues.push(value);
    }
    if (scaleValues[scaleValues.length - 1] !== END_YEAR) {
        scaleValues.push(END_YEAR);
    }
// Erstelle den Slider
    noUiSlider.create(slider, {
        range: {
            min: START_YEAR,
            max: END_YEAR
        },
        start: [START_YEAR, END_YEAR],
        connect: true,
        pips: {
            mode: 'values',
            values: scaleValues,
            density: 5
        }
    });

// Event-Listener für Änderungen der Slider-Werte
    slider.noUiSlider.on('set', values => {
        // Formatiere die Jahreszahl als Datum
        yearRange = values.map(value => {
            let newValue = Math.floor(value);
            newValue = newValue + ('-00-00');
            return newValue;
        });
        getPersonPlaces(API_URL, yearRange[0], yearRange[1], bornDied);
        // DEBUG
        // console.log('YearRange: %o', yearRange);
    });
*/

    /**
     * Funktion, die die Orte aus der Tabelle "ort" holt, die Daten fein umstrukturiert und sie dann an @links
     * showPlaces übergibt
     * @param apiUrl Basis-URL zur Api (ohne "/ort")
     */
    async function getPlaces(apiUrl) {
        let url = apiUrl;
        if (CONFIRMED) {
            url += '/places';
        }
        else {
            url += '/places?unconfirmed=true';
        }
        // GET-Abrfage an die API
        let result = await fetch(url, {
            headers: {
                'Content-Type': 'application/json'
            },
        });
        // Extraktion des Bodys in JSON
        result = await result.json();
        // DEBUG
        console.log('result before: %o', result);
        // Extraktion und Umformattierung
        result = result
            .reduce((acc, place) => {
                let lastPlace = acc[acc.length - 1];
                let movement = {
                    movementID: place.movementID,
                    movementName: place.movementName,
                    description: place.description,
                    links: [place.link],
                    startYear: place.startYear,
                    endYear: place.endYear
                };
                // Gibt es überhaupt schon einen Eintrag?
                if (lastPlace) {
                    // Wenn der letzte Eintrag gleich ist (also die aktuelle Stadt schon im neuen Result acc existiert)
                    if (place.placeName === lastPlace.placeName) {
                        let lastMovement = lastPlace.movements[lastPlace.movements.length - 1];
                        // Wenn das aktuelle movement gleich dem letzten ist, dann hat sich nur der Link geändert
                        if (place.movementName === lastMovement.movementName) {
                            // Füge also den aktuellen Link hinzu
                            lastMovement.links.push(place.link);
                        }
                        // Ansonsten füge das neue movement der aktuellen Stadt hinzu
                        else {
                            lastPlace.movements.push(movement);
                        }
                    }
                    // Ansonsten füge den Ort neu hinzu
                    else {
                        pushPlace(acc);
                    }
                } else {
                    pushPlace(acc);
                }

                // Konstruiert einen neuen Ort und fügt ihn acc hinzu
                function pushPlace(acc) {
                    acc.push({
                        placeID: place.placeID,
                        placeName: place.placeName,
                        latitude: place.latitude,
                        longitude: place.longitude,
                        movements: [movement]
                    });
                }

                return acc;
            }, []);

        // Filtere leere Links heraus
        result = result.map(place => {
            place.movements = place.movements.map(movement => {
                // Wenn der Link nicht falsy ist (null, "", ...), dann bleibt er drin
                movement.links = movement.links.filter(link => link);
                return movement;
            });
            return place;
        });
        // DEBUG
        console.log('result after: %o', result);
        showPlaces(result);
        addMovements(result);
    }

    /**
     * Zeigt die Bewegungen mit Markern auf der Karte an
     * @param places
     */
    function showPlaces(places) {
        let markersGroup = L.featureGroup();
        // Icon mit eigenem Sprite
        let protestIcon = L.icon(ICON_SETTINGS);
        for (let place of places) {
            let {placeName, latitude, longitude} = place;
            let marker = L.marker([latitude, longitude],
                {title: placeName,
                icon: protestIcon});
            // Speichere den Marker in der Map
            markers.set(placeName, marker);
            markersGroup.addLayer(marker);
            }
        markersGroup.addTo(map);
    }

    async function addMovements(places) {
        for (let place of places) {
            let {placeName, movements} = place;
            if (movements) {
                // Hol den Marker des aktuellen Ortes aus der Map
                let marker = markers.get(placeName);
                let popup = L.popup({
                    maxWidth: 500
                });
                for (let movement of movements) {
                    let {movementName, description, links, startYear, endYear} = movement;
                    // Es wäre so schön, hier den nullish coalescing operator nutzen zu können :-(.
                    // Wenn endYear nicht gesestzt ist, setze es auf 'heute'
                    endYear = endYear || 'heute';
                    let oldPopupContent = popup.getContent() || '';
                    let popupContent = `${oldPopupContent}<strong>${movementName}</strong><br>`;
                    if (startYear)
                        popupContent += `<em>Aktiv von ${startYear} bis ${endYear}</em><br>`;
                    if (description)
                        popupContent += `${description}<br><br>`;
                    // Ist das Link-Array vorhanden und nicht leer?
                    if (Array.isArray(links) && (links.length > 0)) {
                        popupContent += 'Weitere Infos:<br>';
                        for (let link of links) {
                            // Füge jeden Link in neuer Zeile hinzu
                            popupContent += `${link}<br>`;
                        }
                        // popupContent += `${links}<br>`;
                    }
                    popupContent += '<br>';
                    popup.setContent(popupContent);
                }
                marker.bindPopup(popup);
                // Aktualisiere den marker im Set
                markers.set(placeName, marker);
            }
        }
    }

    function getFormData() {
        let form = document.getElementById('protestInput');
        form.addEventListener('submit', event => {
            event.preventDefault();
            let formData = new FormData(form);
            let data = {};
            for (const [key, value] of formData) {
                data[key] = value;
            }
            sendFormData(API_URL, data);
        });
    }

    async function sendFormData(url, data) {
        let response = await fetch((API_URL + '/places?unconfirmed=true'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
    }

getPlaces(API_URL);
getFormData();

// Ende document ready function
});
