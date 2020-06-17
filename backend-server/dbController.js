const express = require('express');
const router = express.Router();
const model = require('./dbModel');

/**
 * Get-Route für die Orte mit Movements
 */
router.get('/places', (req, res) => {
    model.getPlaces()
        .then(values => {
            res.json(values);
        }).catch(error => {
        console.error(error);
        res.send(`Error: ${error.message}`);
    });
});

/**
 * Post-Route, um neue Daten zu adden
 */
/*
router.post('/places', (req, res) => {
    model.getPlaces()
        .then(values => {
            res.json(values);
        }).catch(error => {
        console.error(error);
        res.send(`Error: ${error.message}`);
    });
});
*/

module.exports = router;