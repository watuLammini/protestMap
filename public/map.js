// @formatter:off
// @formatter:on
$(function () {

// DEBUG
// Test-Daten
    const TEST_MOVEMENTS =
        [
            {
                "name": "Black Lives Matter MUC",
                "startYear": 2020,
                "endYear": null,
                "places": [
                    {
                        "placeName": "München",
                        "lat": 48.1551,
                        "lon": 11.5418
                    }
                ]
            },
            {
                "name": "Kolbermoorer Räterepublik",
                "startYear": 1919,
                "endYear": 1919,
                "places": [
                    {
                        "placeName": "Kolbermoor",
                        "lat": 47.8516,
                        "lon": 12.0644
                    }
                ]
            }
        ];

// == Konstanten ==
    const API_URL = 'http://localhost:3000/api';
// Bereich der auswählbaren Jahre
    const START_YEAR = 1000;
    const END_YEAR = 1850;
// Alle x Jahre gibt es Labels/pips
    const YEAR_SCALE_STEP = 100;

    let yearRange = [START_YEAR + '-00-00', END_YEAR + '-00-00'];
    let bornDied = 3;

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


// map.on("moveend", () => { });

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


    /**
     * Funktion, die Orte aus der Tabelle "ort" holt und sie dann an @link showPlaces übergibt
     * @param apiUrl Basis-URL zur Api (ohne "/ort")
     */
    async function getPlaces(apiUrl) {
        let rawResult = await fetch(`${apiUrl}/places`, {
            headers: {
                'Content-Type': 'application/json'
            },
        });
        rawResult = await rawResult.json();
        console.log('rawResult before: %o', rawResult);
        rawResult = rawResult
            .reduce((acc, place) => {
                let lastEntry = acc[acc.length - 1];
                let movement = {
                    movementID: place.movementID,
                    movementName: place.movementName,
                    startYear: place.startYear,
                    endYear: place.endYear
                };
                if (lastEntry) {
                    if (place.placeName === lastEntry.placeName) {
                        lastEntry.movements.push(movement);
                    }
                    else {
                        pushPlace(acc);
                    }
                } else {
                    pushPlace(acc);
                }

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
        console.log('rawResult after: %o', rawResult);
        showPlaces(rawResult);
        addMovements(rawResult);
    }

    /**
     * Zeigt die Bewegungen mit Markern auf der Karte an
     * @param places
     */
    function showPlaces(places) {
        let markersGroup = L.featureGroup();
        for (let place of places) {
            let {placeName, latitude, longitude} = place;
            for (let place of places) {
                let marker = L.marker([latitude, longitude],
                    {title: placeName});
                markers.set(placeName, marker);
                markersGroup.addLayer(marker);
            }
        }
        markersGroup.addTo(map);
    }

    async function addMovements(places) {
        for (let place of places) {
            let {placeName, movements} = place;
            if (movements) {
                let marker = markers.get(placeName);
                let popup = L.popup();
                for (let movement of movements) {
                    let {startYear, endYear, movementName} = movement;
                    // Es wäre so schön, hier den nullish coalescing operator nutzen zu können :-(
                    endYear = endYear || 'heute';
                    let popupContent = popup.getContent() || '';
                    popup.setContent(`${popupContent}${movementName}; aktiv von ${startYear} bis ${endYear}<br>`);
                    marker.bindPopup(popup);
                    markers.set(placeName, marker);
                }
            }
        }
    }

// DEBUG
getPlaces(API_URL);
// Ende document ready function
});