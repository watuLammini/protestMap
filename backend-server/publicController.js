const express = require('express');
const router = express.Router();

router.get('/map', (req, res) => {
    if (req.query['unconfirmed']) {

    }
    res.sendFile('public/map.html');
});

module.exports = router;