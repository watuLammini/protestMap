const express = require('express');
const router = express.Router();
const authenticator = require('express-basic-auth');

router.get('/admin', authenticator({
    users: {
        'Pastinaken': 'STANdenundTESten',
    },
    challenge: true
}), async (req, res) => {
    res.sendFile('mapAdmin.html', { root: 'secret' });
});

router.get('/', async (req, res) => {
    res.sendFile('map.html', { root: 'public' });
});

module.exports = router;