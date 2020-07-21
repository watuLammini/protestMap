const express = require('express');
const router = express.Router();
const model = require('./dbModel');

/**
 * Get-Route für die Orte mit Movements
 */
router.get('/places', (req, res) => {
    if (req.query['unconfirmed']) {
        model.getPlaces(false)
            .then(values => {
                res.json(values);
            }).catch(error => {
            console.error(error);
            res.send(`Error: ${error.message}`);
        });
    }
    else {
        model.getPlaces(true)
            .then(values => {
                res.json(values);
            }).catch(error => {
            console.error(error);
            res.send(`Error: ${error.message}`);
        });
    }
});

/**
 * Get-Route für die Orte mit Movements für neu hinzugefügte Movements, die noch nicht freigegeben wurden
 */
/*router.get('/places', (req, res) => {
    model.getPlaces()
        .then(values => {
            res.json(values);
        }).catch(error => {
        console.error(error);
        res.send(`Error: ${error.message}`);
    });
});*/

/**
 * Post-Route, um neue Daten zu adden
 */
router.post('/places', async (req, res) => {
    const confirmed = req.query['confirmed'];
    let result = await model.processInput(req.body, confirmed);
    if (!result.errors) {
        res.status(204).send();
    }
    else {
        // DEBUG
        res.status(400).send(result.errors);
    }
});

module.exports = router;