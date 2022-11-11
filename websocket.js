const ws = require('ws');
const config = require('./config');

const wss = new ws.WebSocketServer({ port: config.websocketPort });

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

console.log(`Websocket server listening at ${config.websocketPort}`);