const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const placesSchema = require('./placesSchema');
const placesInputSchema = require('./placesInputSchema');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const domPurify = createDOMPurify(window);
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
 * Fall true, werden die Daten anfangs formattiert (bspw. das Datum). Das ist nur einmal nötig, danach sollte der Wert
 * auf false gesetzt werden.
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
    // connection.query("SET sql_mode = '';");
    if (INIT_DB) {
        let initQuery = fs.readFileSync(path.resolve('backend-server/initFormat.sql'), 'utf-8');
        try {
            await connection.query(initQuery);
        }
        catch (error) {
            throw error;
        }
        readAndInsertData('inputData/Black Lives Matter_Occupay Wallstreet.json');
        readAndInsertData('inputData/Senegal_Süd Afrika_Kongo.json');
        readAndInsertData('inputData/Svea.json');
        readAndInsertData('inputData/protestlatinamerica.json');
    }
}

// R: Führe die initDB in anonymer, globaler Funktion aus
(async () => {
    await initDB();
})();

// R: Gib die Tabelle Ort formatiert zurück
exports.getPlaces = async function (confirmed = true) {
    let tableNames = getTableNames(confirmed);
    try {
        let result = await connection.query(`SELECT p.id as placeID, p.name as placeName, p.latitude, p.longitude, m.id as movementID, m.name as movementName, m.description as description, ml.link as link, m.startYear as startYear, m.endYear as endYear
            FROM ${tableNames.movementPlaceTable} mp
                INNER JOIN ${tableNames.placeTable} p ON mp.placeID = p.id
                INNER JOIN ${tableNames.movementTable} m ON mp.movementID = m.id
                LEFT JOIN ${tableNames.movementLinkTable} ml ON ml.movementID = m.id
                ORDER BY placeName, movementName ASC;`);
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

exports.processInput = async function(data, confirmed = false) {
    domPurify.setConfig( {ALLOWED_TAGS: [] });
    data = JSON.parse(domPurify.sanitize(JSON.stringify(data)));
    for (let key in data) {
        if (data.hasOwnProperty(key)) {
            switch (key) {
                case "":
                    data[key] = null;
                    break;
                case "latitude":
                    data[key] = parseInt(data[key]);
                case "longitude":
                    data[key] = parseInt(data[key]);
                case "startYear":
                    data[key] = parseInt(data[key]);
                case "endYear":
                    data[key] = parseInt(data[key]);
            }
        }
    }
    if (data.links) {
        data.links = data.links.split(',');
        for (let [i, link] of data.links.entries()) {
            data.links[i] = link.trim();
        }
    }
    else {
        data.links = [];
    }
    return await insert([ data ], confirmed);
};

async function insert(data, confirmed = true) {
    // DEBUG
    /*data = [ {
        movementName: "noPAG",
        startYear: 2018,
        placeName: "München",
        links: [
            "https://www.nopagby.de/",
            "https://de.wikipedia.org/wiki/Polizeiaufgabengesetz_(Bayern)"
        ],
        latitude: 48.1551,
        longitude: 11.5418
    } ];*/
    let response = { errors: null };
    let validationResult = validate(placesInputSchema, data);
    if (!validationResult.errors) {
        for (let movement of data){
            // Remove NaN values
            for (const key in movement) {
                if (movement.hasOwnProperty(key)) {
                    if (Number.isNaN(movement[key])) {
                        movement[key] = null;
                    }
                }
            }
            let movementSet = {
                name: movement.movementName,
                description: movement.description,
                startYear: movement.startYear,
                endYear: movement.endYear
            };
            let placeSet = {
                name: movement.placeName,
                latitude: movement.latitude,
                longitude: movement.longitude
            };

            let tableNames = getTableNames(confirmed);
            try {
                let resultM = await connection.query(`INSERT INTO ${tableNames.movementTable} SET ? 
                    ON DUPLICATE KEY UPDATE ? ;`, [movementSet, movementSet]);
                let resultP = await connection.query(`INSERT INTO ${tableNames.placeTable} SET ? 
                    ON DUPLICATE KEY UPDATE ? ;`, [placeSet, placeSet]);
                let resultMP = await connection.query(`INSERT INTO ${tableNames.movementPlaceTable} SET 
                    movementID = (SELECT id FROM ${tableNames.movementTable} WHERE name = ?),
                    placeID = (SELECT id FROM ${tableNames.placeTable} WHERE name = ?)
                    ON DUPLICATE KEY UPDATE 
                    movementID = (SELECT id FROM ${tableNames.movementTable} WHERE name = ?),
                    placeID = (SELECT id FROM ${tableNames.placeTable} WHERE name = ?);`, [movementSet.name, placeSet.name, movementSet.name, placeSet.name]);
                for (let link of movement.links) {
                    let resultML = await connection.query(`INSERT IGNORE INTO ${tableNames.movementLinkTable} SET 
                        movementID = (SELECT id FROM ${tableNames.movementTable} WHERE name = ?), 
                        link = ? ;`, [movementSet.name, link]);
                }
            }
            catch (error) {
                throw error;
            }
        }
    }
    else {
        response.errors = validationResult.errors;
    }
    return response;
}

function validate(schema, data) {
    let validation = ajv.validate(schema, data);
    response = { errors: null };
    if (!validation) {
        console.error(ajv.errors);
        response['errors'] = ajv.errors;
    }
    return response;
}

async function readAndInsertData(inputPath, confirmed = true) {
    try {
        let input = fs.readFileSync(path.resolve(inputPath), 'utf-8');
        input = await JSON.parse(input);
        await insert(input, confirmed);
    } catch (error) {
        console.error(error);
    }
}

exports.confirmAllUnconfirmed = async function (){
    const tablesConfirmed = getTableNames(true);
    const tablesUnconfirmed = getTableNames(false);
    try {
        let resultM = await connection.query(`INSERT INTO ${tablesConfirmed.movementTable} (name, description, startYear, endYear)
            SELECT name, description, startYear, endYear FROM ${tablesUnconfirmed.movementTable}
            ON DUPLICATE KEY UPDATE
                description = VALUES(description),
                startYear = VALUES(startYear),
                endYear = VALUES(endYear);`);
        let resultP = await connection.query(`INSERT INTO ${tablesConfirmed.placeTable} (name, latitude, longitude)
            SELECT name, latitude, longitude FROM ${tablesUnconfirmed.placeTable}
            ON DUPLICATE KEY UPDATE
                latitude = VALUES(latitude),
                longitude = VALUES(longitude);`);
        let resultMP = await connection.query(`INSERT IGNORE INTO ${tablesConfirmed.movementPlaceTable} (movementID, placeID)
            SELECT mIdNew, pIdNew FROM ${tablesUnconfirmed.copyMPView};`);
        let resultML = await connection.query(`INSERT IGNORE INTO ${tablesConfirmed.movementLinkTable} (movementID, link)
            SELECT mIdNew, link FROM ${tablesUnconfirmed.copyMLView};`);
    }
    catch (error) {
        console.error(error);
        throw error;
    }
    await deleteUnconfirmed();
};

async function deleteUnconfirmed() {
    const tables = getTableNames(false);
    try {
        let result1 = await connection.query(`TRUNCATE ${tables.movementPlaceTable}; TRUNCATE ${tables.movementLinkTable};`);
        let result2 = await connection.query(`DELETE FROM ${tables.movementTable}; DELETE FROM ${tables.placeTable};`);
    }
    catch (error) {
        console.error(error);
    }
}

function getTableNames(confirmed) {
    let tableNames = {};
    if (confirmed) {
        tableNames.placeTable = 'place';
        tableNames.movementTable = 'movement';
        tableNames.movementPlaceTable = 'movementPlace';
        tableNames.movementLinkTable = 'movementLink';
    }
    else {
        tableNames.placeTable = 'placeUnconfirmed';
        tableNames.movementTable = 'movementUnconfirmed';
        tableNames.movementPlaceTable = 'movementPlaceUnconfirmed';
        tableNames.movementLinkTable = 'movementLinkUnconfirmed';
    }
    tableNames.copyMPView = 'copyUnconfirmedMP';
    tableNames.copyMLView = 'copyUnconfirmedML';
    return tableNames;
}