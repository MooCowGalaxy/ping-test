const http = require('node:http');
const ws = require('ws');
const config = require('./config');

const listener = (req, res) => {
    res.writeHead(200);
    res.end("Hello world! This server is online and properly running!");
};

const httpServer = http.createServer(listener);
const wss = new ws.WebSocketServer({ server: httpServer });

wss.on('connection', (ws) => {
    ws.on('message', message => {
        try {
            parseInt(message);
        } catch (e) {
            return;
        }

        ws.send(parseInt(message));
    });
});

httpServer.listen(config.websocketPort, () => {
    console.log(`Websocket server listening at localhost:${config.websocketPort}`);
});