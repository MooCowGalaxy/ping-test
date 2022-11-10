const express = require('express');
const path = require('path');
const config = require('./config');

const renderFile = require('./utils/renderFile');

const app = express();
app.use('/static', express.static(path.resolve('./static')));

app.get('/', async (req, res) => {
    res.send(await renderFile('index'));
});
app.get('/api/servers', (req, res) => {
    res.send(config.servers);
});

app.listen(config.serverPort, () => {
    console.log(`Listening on port ${config.serverPort}.`);
});
