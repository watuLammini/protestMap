// @formatter:off
// @formatter:on
$(function (){

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
if (scaleValues[scaleValues.length-1] !== END_YEAR) {
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
 * (Test) Funktion, die Orte aus der Tabelle "ort" holt und sie dann an @link showPlaces übergibt
 * @param apiUrl Basis-URL zur Api (ohne "/ort")
 */
function getPlaces(apiUrl) {

}

/**
 * Zeigt die Bewegungen mit Markern auf der Karte an
 * @param movements
 */
function showPlaces(movements) {
    let markers = new Map();
    let markersGroup = L.featureGroup();
    for (let movement of movements) {
        let {name: movementName, startYear, endYear, places} = movement;
        for (let place of places){
            let marker = L.marker([place.lat, place.lon],
                {title: place.placeName});
            let popup = L.popup().setContent(movementName);
            marker.bindPopup(popup);
            markers.set(place.placeName, marker);
            markersGroup.addLayer(marker);
        }
    }
    markersGroup.addTo(map);
}

// DEBUG
showPlaces(TEST_MOVEMENTS);
// Ende document ready function
});