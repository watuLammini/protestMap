// @formatter:off
// @formatter:on

$(function () {

// == Konstanten ==
    const API_URL = 'http://localhost:3000/api';
/*// Bereich der auswählbaren Jahre
    const START_YEAR = 1000;
    const END_YEAR = 1850;
// Alle x Jahre gibt es Labels/pips
    const YEAR_SCALE_STEP = 100;

    let yearRange = [START_YEAR + '-00-00', END_YEAR + '-00-00'];*/

    /**
     * Speichert alle Marker mit Namen des Ortes als Key
     * @type {Map<String, Object>}
     */
    let markers = new Map();
// R: Initialisiere die Karte mit gegebenem Mittelpunkt (München) und Zoomstufe
    const map = L.map('map').setView([48.142992, 11.573495], 7);
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
     * Funktion, die die Orte aus der Tabelle "ort" holt, die Daten fein umstrukturiert und sie dann an @link showPlaces übergibt
     * @param apiUrl Basis-URL zur Api (ohne "/ort")
     */
    async function getPlaces(apiUrl) {
        // GET-Abrfage an die API
        let result = await fetch(`${apiUrl}/places`, {
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
                let lastEntry = acc[acc.length - 1];
                let movement = {
                    movementID: place.movementID,
                    movementName: place.movementName,
                    description: place.description,
                    links: place.links,
                    startYear: place.startYear,
                    endYear: place.endYear
                };
                // Gibt es überhaupt schon einen Eintrag?
                if (lastEntry) {
                    // Wenn der letzte Eintrag gleich ist (also die aktuelle Stadt schon im neuen Result acc existiert),
                    // dann füge ihm das aktuelle movement hinzu
                    if (place.placeName === lastEntry.placeName) {
                        lastEntry.movements.push(movement);
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
        let protestIcon = L.icon({
            iconUrl: './assets/feuer.svg',
            iconSize:     [32, 32], // size of the icon
            // iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
            // popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
        });
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
                        popupContent += `${description}<br>`;
                    if (links)
                        popupContent += `${links}<br>`;
                    popupContent += '<br>';
                    popup.setContent(popupContent);
                }
                marker.bindPopup(popup);
                // Aktualisiere den marker im Set
                markers.set(placeName, marker);
            }
        }
    }

// DEBUG
getPlaces(API_URL);


// Ende document ready function
});