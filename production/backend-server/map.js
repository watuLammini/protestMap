const express = require('express');
const cors = require('cors');
const controller = require('./dbController');
const path = require('path');
var favicon = require('serve-favicon');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());
app.use(favicon(path.join('public/assets/Logo-Hand.png')));
app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'agfp.de');
    next();
});

app.use(express.static('public'));
app.use('/api', controller);
// Test
app.get('/helloWorld', (req, res) => {
    res.send("Hello world!");
});

// Fehlerbehandlung
app.use((error, request, result, next) => {
   console.log("An error occured %o", error);
   res.status(500).send("Sorry, something broke :/. See the console for more information.");
});

app.listen(PORT, () => {
    console.log("App listening at port %s", PORT);
});