const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const model = require('./dbModel');

// Get-Route für Tabelle Ort
router.get('/ort', (req, res) => {
    model.getPlaces()
        .then(values => {
            res.json(values);
        }).catch(error => {
        console.error(error);
        res.send(`Error: ${error.message}`);
    });
});

router.get('/birth-death-places', (req, res) => {
    let fromYear = req.query["from-year"];
    let toYear = req.query["to-year"];
    let birthsOrDeaths = req.query["births-or-deaths"];
    if (fromYear && toYear && birthsOrDeaths) {
        model.getBirthDeathPlaces(fromYear, toYear, birthsOrDeaths)
            .then(values => {
                // DEBUG
                // console.log(values);
                res.json(values);
            }).catch(error => {
            console.error(error);
            res.send(`Error: ${error.message}`);
        });
    }
    else {
        model.getBirthDeathPlaces()
            .then(values => {
                res.json(values);
            }).catch(error => {
            console.error(error);
            res.send(`Error: ${error.message}`);
        });
    }
});

// Default get-Route; Gibt die gesamte Tabelle zurück, welcher als Endpunkt angegeben wurde
router.get('/:table', (req, res) => {
    connection.query('SELECT * FROM ??', req.params.table, (error, results, fields) => {
        if (error) {
            throw error;
        }
        else {
            res.send(results);
        }
    });
});

module.exports = router;