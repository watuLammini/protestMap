const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

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
}

// R: Führe die initDB in anonymer, globaler Funktion aus
(async () => {
    await initDB();
})();

// R: Gib die Tabelle Ort formatiert zurück
exports.getPlaces = async function () {
    try {
        let result = await connection.query('SELECT * FROM place;');
        result = result[0]
            // R: Gib nur Ergebnisse mit vorhanden Koordinaten zurück
            .filter(place => (place.Latitude && place.Longitude))
            // R: Gib ein neues Array bestehend aus Koordinaten und Name des Ortes zurück
            .map(place => {
                place.Latitude = parseFloat(place.Latitude);
                place.Longitude = parseFloat(place.Longitude);
                return place;
            });
        return result;
    } catch (error) {
        throw error;
    }
};

/**
 * Gibt ein JSON zurück, welches alle Orte enthält, an denen mindestens eine Person geboren oder gestorben ist.
 * Format:
 * {
 *     Ort: {
 *         Lat: ...
 *         Long: ...
 *         Born: [
 *             {
 *                 Died: [
 *                     Name: Aachen,
 *                     Lat: ...,
 *                     Lon: ...
 *                 ]
 *                 ID: ...,
 *                 Name: ...,
 *                 Date: ...,
 *             }
 *         ],
 *         DiedWhere: {
 *             Ort: {
 *                 Lat: ...,
 *                 Lon: ...,
 *                 Persons: []
 *             }
 *         }
 *         Died: [
 *              {
 *                  ID: ...,
 *                  Name: ...,
 *                  Date: ...
 *              }
 *         ]
 *     }
 * }
 */
exports.getBirthDeathPlaces = async function (fromYear, toYear, birthsOrDeaths) {
    let birthDeathPlaces;
    try {
        if (fromYear && toYear) {
            // Je nachdem, ob Geburten, Tode oder beides ausgewählt wurde, werden auch nur die entsprechenden Datumsangaben berücksichtigt
            switch (birthsOrDeaths) {
                case 'born':
                    birthDeathPlaces = await connection.query("SELECT P.F41 AS Id, P.ZLabel AS Name, P.F13 AS Birthdate, P.F14 AS Deathdate, " +
                        "O.Ort AS Birthplace, O.B AS BirthLat, O.L AS BirthLon, O2.Ort as Deathplace, O2.B AS DeathLat, O2.L AS DeathLon, " +
                        "A.Hofamt as Position, A.Rang as Hierarchy " +
                        "FROM person AS P JOIN ort AS O ON P.F15 = O.Ort " +
                        "JOIN ort AS O2 ON P.F17 = O2.Ort " +
                        "LEFT JOIN transkriptionen AS T ON P.F41 = T.F41 " +
                        "LEFT JOIN amt AS A ON T.Amt = A.Amt " +
                        "WHERE O.B <> '' AND O2.B <> '' " +
                        "AND P.Birthdate >= ? AND P.Birthdate <= ? " +
                        "GROUP BY P.F41;", [fromYear, toYear]);
                    break;
                case 'died':
                    birthDeathPlaces = await connection.query("SELECT P.F41 AS Id, P.ZLabel AS Name, P.F13 AS Birthdate, P.F14 AS Deathdate, " +
                        "O.Ort AS Birthplace, O.B AS BirthLat, O.L AS BirthLon, O2.Ort as Deathplace, O2.B AS DeathLat, O2.L AS DeathLon, " +
                        "A.Hofamt as Position, A.Rang as Hierarchy " +
                        "FROM person AS P JOIN ort AS O ON P.F15 = O.Ort " +
                        "JOIN ort AS O2 ON P.F17 = O2.Ort " +
                        "LEFT JOIN transkriptionen AS T ON P.F41 = T.F41 " +
                        "LEFT JOIN amt AS A ON T.Amt = A.Amt " +
                        "WHERE O.B <> '' AND O2.B <> '' " +
                        "AND P.Deathdate >= ? AND P.Deathdate <= ? " +
                        "GROUP BY P.F41;", [fromYear, toYear]);
                    break;
                default:
                    birthDeathPlaces = await connection.query("SELECT P.F41 AS Id, P.ZLabel AS Name, P.F13 AS Birthdate, P.F14 AS Deathdate, " +
                        "O.Ort AS Birthplace, O.B AS BirthLat, O.L AS BirthLon, O2.Ort as Deathplace, O2.B AS DeathLat, O2.L AS DeathLon, " +
                        "A.Hofamt as Position, A.Rang as Hierarchy " +
                        "FROM person AS P JOIN ort AS O ON P.F15 = O.Ort " +
                        "JOIN ort AS O2 ON P.F17 = O2.Ort " +
                        "LEFT JOIN transkriptionen AS T ON P.F41 = T.F41 " +
                        "LEFT JOIN amt AS A ON T.Amt = A.Amt " +
                        "WHERE O.B <> '' AND O2.B <> '' " +
                        "AND ((P.Birthdate >= ? AND P.Birthdate <= ?) " +
                        "OR (P.Deathdate >= ? AND P.Deathdate <= ?)) " +
                        "GROUP BY P.F41;", [fromYear, toYear, fromYear, toYear]);
            }
        } else {
            // R: Gib im Moment nur Orte zurück, die Koordinaten besitzen
            birthDeathPlaces = await connection.query("SELECT P.F41 AS Id, P.ZLabel AS Name, P.F13 AS Birthdate, P.F14 AS Deathdate, " +
                "O.Ort AS Birthplace, O.B AS BirthLat, O.L AS BirthLon, O2.Ort as Deathplace, O2.B AS DeathLat, O2.L AS DeathLon, " +
                "A.Hofamt as Position, A.Rang as Hierarchy " +
                "FROM person AS P JOIN ort AS O ON P.F15 = O.Ort " +
                "JOIN ort AS O2 ON P.F17 = O2.Ort " +
                "LEFT JOIN transkriptionen AS T ON P.F41 = T.F41 " +
                "LEFT JOIN amt AS A ON T.Amt = A.Amt " +
                "WHERE O.B <> '' AND O2.B <> '' " +
                "GROUP BY P.F41;");
        }
    }
    catch (error) {
        throw error;
    }

    result = {};
    // Für jeden Eintrag
    for (let row of birthDeathPlaces[0]) {
        // Person mit Geburtsdatum
        let birthPerson = createPerson(row.Id, row.Name, row.Birthdate, row.Position, row.Hierarchy);
        // Person mit Todesdatum
        let deathPerson = createPerson(row.Id, row.Name, row.Deathdate, row.Position, row.Hierarchy);
        // Existiert der Geburtsort schon?
        if (result[row.Birthplace]) {
            // Gibt es schon einen Eintrag im Array Born?
            if (result[row.Birthplace]['Born']) {
                // Gibt es darin schon ein Died-Array?
                result[row.Birthplace]['Born'].push(birthPerson);
            } else {
                result[row.Birthplace]['Born'] = [ birthPerson ];
            }
            // Gibt es das DiedWhere-Objekt schon?
            if (!result[row.Birthplace]["DiedWhere"]) {
                result[row.Birthplace]["DiedWhere"] = {};
            }
            // Gibt es schon einen Sterbeort in dem (Geburts)Ort?
            if (result[row.Birthplace]["DiedWhere"][row.Deathplace]) {
                result[row.Birthplace]["DiedWhere"][row.Deathplace]["Persons"].push(deathPerson);
            }
            // Sterbeort im (Geburts)Ort muss noch angelegt werden
            else {
                result[row.Birthplace]["DiedWhere"][row.Deathplace] = {
                    Lat: parseFloat(row.DeathLat),
                    Lon: parseFloat(row.DeathLon),
                    Persons: [ deathPerson ]
                }
            }
        }

        // Noch kein Eintrag für den Geburtsort
        else {
            result[row.Birthplace] = {
                Lat: parseFloat(row.BirthLat),
                Lon: parseFloat(row.BirthLon),
                Born: [ birthPerson ],
                DiedWhere: {
                    [row.Deathplace]: {
                        Lat: parseFloat(row.DeathLat),
                        Lon: parseFloat(row.DeathLon),
                        Persons: [ deathPerson ]
                    }
                }
            }
        }   // Ende Geburtsteil

        // Gibt es den Sterbeort schon?
        if (result[row.Deathplace]) {
            // Gibt es das Died-Array schon?
            if (result[row.Deathplace]['Died']) {
                result[row.Deathplace]['Died'].push( deathPerson );
            } else {
                result[row.Deathplace]['Died'] = [ deathPerson ];
            }
        }
        // Sterbeort existiert noch nicht
        else {
            result[row.Deathplace] = {
                Lat: parseFloat(row.DeathLat),
                Lon: parseFloat(row.DeathLon),
                Died: [ deathPerson ]
            }
        }
    }
    return result;
};

/**
 * Erstellt ein Personen-Objekt für andre Funktionen bzw. den Client
 */
function createPerson(iD, name, date, position, rank) {
    return {
        ID: iD,
        Name: name,
        Date: date,
        Position: position,
        Rank: rank
    };
}
