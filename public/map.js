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
const INITIAL_HUE = 60;
const DEFAULT_HUE = 100;

let yearRange = [START_YEAR + '-00-00', END_YEAR + '-00-00'];
let bornDied = 3;

// R: Initialisiere die Karte mit gegebenem Mittelpunkt (München) und Zoomstufe
const map = L.map('map').setView([48.142992, 11.573495], 7);
// R: Füge die OpenStreetMap tiles hinzu
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

/**
 * Hole alle Orte mit den zugehörigen Personen (geboren, gestorben) vom Backend
 * @param apiUrl Basis URL des Backends
 * @param fromYear Untere Grenze der Jahre, nach denen gefiltert wird
 * @param toYear Obere Grenze der Jahre, nach denen gefiltert wird
 * @param birthsOrDeaths Werden Geburten (1), Tode (2) oder beides (3) angezeigt?
 */
function getPersonPlaces(apiUrl, fromYear, toYear, birthsOrDeaths) {
    if (fromYear && toYear) {
        params = {
            "from-year": fromYear,
            "to-year": toYear
        };
        switch (birthsOrDeaths) {
            case 1:
                params['births-or-deaths'] = 'born';
                break;
            case 2:
                params['births-or-deaths'] = 'died';
                break;
            default:
                params['births-or-deaths'] = 'both';
        }
    }
    else {
        params = null;
    }
    $.get(
        apiUrl + '/birth-death-places',
        params,
        data => {
            // DEBUG
            // data = data.filter(row => row.Lat >= 48.1 && row.Lat <= 48.3 && row.Lon >= 16 && row.Lon <= 17);
            // console.log('Data: %o', data);
            data = Object.values(data);
            showPersonPlaces(data, birthsOrDeaths);
            showBirthDeathLines(data);
        });
}

/**
 * Male die Kreise nach Orten/Personen auf die Karte
 * @param personPlaces Daten der Ort mit geboren/gestorben
 * @param birthsOrDeaths Werden Geburten (1), Tode (2) oder beides (3) angezeigt?
 */
function showPersonPlaces(personPlaces, birthsOrDeaths) {

    // Lösche die bereits vorhandenen Elemente
    $('#map svg g').empty();

    let svg = d3.select('#map').select('svg');
    // Falls das SVG noch nicht existiert, leg es an
    if (!svg.node()) {
        L.svg().addTo(map);
        svg = d3.select('#map').select('svg');
    }
    g = svg.select('g');

    g
        .selectAll("circle")
        .data(personPlaces)
        .enter()
        .append("circle")
        // Farbe
        .attr("fill", d => {
            let rank;
            switch (birthsOrDeaths) {
                case 1:
                    rank = getStatsPerPlace(d).averageBornRank;
                    break;
                case 2:
                    rank = getStatsPerPlace(d).averageDiedRank;
                    break;
                case 3:
                    rank = getStatsPerPlace(d).averageRank;
                    break;
            }
            // Transformiere rank in den Bereich 0 - 3
            rank -= 2;
            let hue = DEFAULT_HUE;

            if (rank) {
                let hueShift = 120 * (rank / 3);
                hue = INITIAL_HUE - hueShift;
                if (hue < 0) {
                    hue += 360;
                }
                if (hue > 360) {
                    hue -= 360;
                }
            }
            return `hsl(${hue}, 100%, 50%)`;
        })
        // Radius
        .attr("r", d => {
            let count = 0;
            // Hole den entsprechenden counter für die Größe der Kreise, je nachdem, ob Geburten oder Tode ausgewählt werden
            switch (birthsOrDeaths) {
                case 1:
                    count = getStatsPerPlace(d).bornCount;
                    break;
                case 2:
                    count = getStatsPerPlace(d).diedCount;
                    break;
                case 3:
                    count = getStatsPerPlace(d).totalCount;
                    break;
                default:
                    count = getStatsPerPlace(d).totalCount;
            }
            if (count === 0) {
                return 0;
            }
            else {
                // Größe der Kreise in Abhängigkeit der Anzahl an Leuten
                return Math.floor(8 + ((count - 1) * (8 / 60)));
            }
        })
        // Mittelpunkt
        .attr("cx", function(d){ return map.latLngToLayerPoint([d.Lat, d.Lon]).x })
        .attr("cy", function(d){ return map.latLngToLayerPoint([d.Lat, d.Lon]).y });
}

/**
 * Updatet die Karte bzw. Overlays, wenn sich etwas ändert, bspw. durch Bewegung
 */
function update() {
d3.selectAll("circle")
    .attr("cx", function(d){ return map.latLngToLayerPoint([d.Lat, d.Lon]).x })
    .attr("cy", function(d){ return map.latLngToLayerPoint([d.Lat, d.Lon]).y });
}

/**
 * Zeichne die Verbindungslinien zwischen den Städten
 * @param personPlaces Daten mit Orten und geboren/gestorben
 */
function showBirthDeathLines(personPlaces) {
    // Für jeden (Geburts-)Ort
    for (let birthPlace of personPlaces) {
        if (birthPlace.DiedWhere) {
            // Für jeden Ort, an dem die Leute des Geburtsortes gestorben sind
            for (let deathPlace of Object.values(birthPlace.DiedWhere)) {
                const peopleDiedCount = deathPlace.Persons.length;
                if (peopleDiedCount > 1) {
                    const coordinates = [[birthPlace.Lat, birthPlace.Lon], [deathPlace.Lat, deathPlace.Lon]];
                    let colorGradient = 'url(#strokeGradient)';
                    if (deathPlace.Lon - birthPlace.Lon < 0.0) {
                        colorGradient = 'url(#strokeGradientReverse)';
                    }
                    let lineOptions = {
                        weight: 1 + (peopleDiedCount - 1) * 3 / 2,
                        color: colorGradient
                    };
                    const bornDeathLine = L.polyline(coordinates, lineOptions).addTo(map);
                }
            }
        }
    }
}

/**
 * Gibt ein Objekt mit einigen Werten zu einem Ort zurück
 */
function getStatsPerPlace(place) {
    let bornCount = 0;
    let diedCount = 0;
    let totalBornRank = 0;
    let personsWithBornRank = 0;
    let totalDiedRank = 0;
    let personsWithDiedRank = 0;
    if (place.Born) {
        bornCount = place.Born.length;
        for (let person of place.Born) {
            if (person.Rank) {
                totalBornRank += person.Rank;
                personsWithBornRank++;
            }
        }
    }
    if (place.Died) {
        diedCount = place.Died.length;
        for (let person of place.Died) {
            if (person.Rank) {
                totalDiedRank += person.Rank;
                personsWithDiedRank++;
            }
        }
    }
    return {
        totalCount: bornCount + diedCount,
        bornCount: bornCount,
        diedCount: diedCount,
        averageBornRank: totalBornRank / personsWithBornRank,
        averageDiedRank: totalDiedRank / personsWithDiedRank,
        averageRank: (totalBornRank + totalDiedRank) / (personsWithBornRank + personsWithDiedRank)
    }
}

map.on("moveend", update);
getPersonPlaces(API_URL, null, null, bornDied);


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

// == BornDied Buttons ==
const buttons = $('#bornDiedButtons input');
buttons.on('change', event => {
    let value = event.target.value;
    switch (value) {
        case 'born':
            bornDied = 1;
            break;
        case 'died':
            bornDied = 2;
            break;
        case 'both':
            bornDied = 3;
    }
    getPersonPlaces(API_URL, yearRange[0], yearRange[1], bornDied);
});

/**
 * (Test) Funktion, die Orte aus der Tabelle "ort" holt und sie dann an @link showPlaces übergibt
 * @param apiUrl Basis-URL zur Api (ohne "/ort")
 */
function getPlaces(apiUrl) {

}

/**
 * (Test) Funktion, die ein Objekt mit Orten erhält und diese dann als Marker zur Map hinzufügt
 * @param movements Orte
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