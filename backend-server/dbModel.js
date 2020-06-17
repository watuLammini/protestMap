const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const placesSchema = require('./placesSchema');
const placesInputSchema = require('./placesInputSchema');

let ajv = new Ajv( {allErrors: true} );

const CONNECTION_DATA = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'protestMap',
    multipleStatements: true,
    connectionLimit: 10,
    // DEBUG
    debug: false
};

/**
 * Fall true, werden die Daten anfangs formattiert (bspw. das Datum). Das ist nur einmal nötig, danach sollte der Wert auf false gesetzt werden.
 */
const INIT_DB = false;
let connection;

/**
 * R: Verbinde zur und baue die Datenbank auf
 */
async function initDB() {
    // New: Use a connection pool
    connection = await mysql.createPool(CONNECTION_DATA);
    // Konfiguration, damit Group By und die Datumstransformation funktioniert
    connection.query("SET sql_mode = '';");
    if (INIT_DB) {
        let initQuery = fs.readFileSync(path.resolve('backend-server/initFormat.sql'), 'utf-8');
        try {
            await connection.query(initQuery);
        }
        catch (error) {
            throw error;
        }
    }

    // DEBUG
    testValidate(placesSchema, [
        {
            placeID: 1,
            placeName: "München"
        }
    ]);
    insert();
}

// R: Führe die initDB in anonymer, globaler Funktion aus
(async () => {
    await initDB();
})();

// R: Gib die Tabelle Ort formatiert zurück
exports.getPlaces = async function () {
    try {
        let result = await connection.query(`SELECT p.id as placeID, p.name as placeName, p.latitude, p.longitude, m.id as movementID, m.name as movementName, m.description as description, m.links as links, m.startYear as startYear, m.endYear as endYear
            FROM movementPlace mp
                INNER JOIN place p ON mp.placeID = p.id
                INNER JOIN movement m ON mp.movementID = m.id
                ORDER BY placeName DESC;`);
        result = result[0]
            // R: Gib nur Ergebnisse mit vorhanden Koordinaten zurück
            .filter(place => (place.latitude && place.longitude))
            // R: Gib ein neues Array bestehend aus Koordinaten und Name des Ortes zurück
            .map(place => {
                place.latitude = parseFloat(place.latitude);
                place.longitude = parseFloat(place.longitude);
                return place;
            });
        return result;
    } catch (error) {
        throw error;
    }
};

async function insert(data) {
    // DEBUG
    data = [ {
        movementName: "noPAG",
        startYear: 2018,
        placeName: "München",
        latitude: 48.1551,
        longitude: 11.5418
    } ];
    let validationResult = testValidate(placesInputSchema, data);
    if (validationResult) {
        for (let movement of data){
            let movementSet = {
                name: movement.movementName,
                description: movement.description,
                links: movement.links,
                startYear: movement.startYear,
                endYear: movement.endYear
            };
            let placeSet = {
                name: movement.placeName,
                latitude: movement.latitude,
                longitude: movement.longitude
            };
            try {
                let resultM = await connection.query('INSERT INTO movement SET ? ' +
                    'ON DUPLICATE KEY UPDATE ? ;', [movementSet, movementSet]);
                let resultP = await connection.query('INSERT INTO place SET ? ' +
                    'ON DUPLICATE KEY UPDATE ? ;', [placeSet, placeSet]);
                let resultMP = await connection.query('INSERT INTO movementPlace SET ' +
                    'movementID = (SELECT id FROM movement WHERE name = ?), ' +
                    'placeID = (SELECT id FROM place WHERE name = ?) ' +
                    'ON DUPLICATE KEY UPDATE ' +
                    'movementID = (SELECT id FROM movement WHERE name = ?), ' +
                    'placeID = (SELECT id FROM place WHERE name = ?) ', [movementSet.name, placeSet.name, movementSet.name, placeSet.name]);
            }
            catch (error) {
                throw error;
            }
        }
    }
}

function testValidate(schema, data) {
    let validation = ajv.validate(schema, data);
    if (!validation) {
        console.log(ajv.errors);
    }
    return validation;
}