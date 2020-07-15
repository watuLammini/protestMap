const express = require('express');
const cors = require('cors');
const controller = require('./dbController');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

app.use('/api', controller);
app.use(express.static('public'));
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