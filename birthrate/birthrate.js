//getting the mysql database

let mysql = require('mysql');
let fs = require('fs');

let con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "kaiserhofinfovis"
});

con.connect();

function createQueryAndReturnJSON() {
    con.query("SELECT F13 'Birthyear', COUNT(*) 'Frequency' FROM person WHERE F13 != '' AND F13 <= 1200 GROUP BY F13", function (err, result, fields) {
        if (err) throw err;
        fs.writeFile('table.json', JSON.stringify(result), function (err) {
            if (err) throw err;
            console.log('Saved!');
        });
    });
}

createQueryAndReturnJSON();

con.end();

