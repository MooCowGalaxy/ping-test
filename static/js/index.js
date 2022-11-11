const servers = []; // {name, serverName, domain, ws, status, ping}
const colors = ['text-red-400', 'text-amber-400', 'text-green-400'];

function sendPing(ws) {
    try {
        ws.send(Date.now().toString());
    } catch (e) {
        console.error(e);
    }
}
function setPing(id, ping) { // null for N/A, number for ms
    const serverName = servers[id].serverName;
    const serverPing = $(`#${serverName}-ping`);

    for (const color of colors) serverPing.removeClass(color);
    serverPing.text(ping === null ? 'N/A' : `${ping}ms`);
    if (ping !== null) {
        let color;
        if (ping < 100) {
            color = 2;
        } else if (ping < 250) {
            color = 1;
        } else color = 0;
        serverPing.addClass(colors[color]);
    }

    servers[id].ping = ping;
}
function setStatus(id, status) { // 0: offline, 1: connecting, 2: online
    const serverName = servers[id].serverName;
    const serverStatus = $(`#${serverName}-status`);

    for (const color of colors) serverStatus.removeClass(color);
    serverStatus.text(['Offline', 'Connecting', 'Online'][status]);
    serverStatus.addClass(colors[status]);

    servers[id].status = status;
}
function createWebsocket(id) {
    const server = servers[id];

    // const connectionType = window.location.protocol === 'http:' ? 'ws' : 'wss';
    const connectionType = 'wss';

    const ws = new WebSocket(`${connectionType}://${server.domain}`);
    setStatus(id, 1);
    setPing(id, null);

    ws.onopen = () => {
        setStatus(id, 2);
        sendPing(ws);
    };
    ws.onmessage = (message) => {
        const time = parseInt(message.data);
        const ping = Date.now() - time;

        setPing(id, ping);
    };
    ws.onclose = (reason) => {
        console.log('ws closed');
        console.log(reason);
        setStatus(id, 0);
        setPing(id, null);
        setTimeout(() => {
            createWebsocket(id);
        }, 5000);
    };
    ws.onerror = (error) => {
        console.error(error);
    };

    servers[id].ws = ws;
}
function initializeServer(server) {
    const serverName = server.name.toLowerCase().replaceAll(' ', '-');
    $('#servers').append(`
        <div class="border border-neutral-300 py-2 px-4 rounded mb-2 flex flex-row justify-between" id="${serverName}">
            <div>
                <h3>${server.name}</h3>
                <p>Status: <span class="font-medium text-red-400" id="${serverName}-status">Offline</span></p>
            </div>
            <div>
                <p class="text-green-400" id="${serverName}-ping"></p>
            </div>
        </div>
    `);
    const id = servers.length;
    servers.push({
        id,
        name: server.name,
        serverName,
        domain: server.domain,
        ws: null,
        status: 1,
        ping: null
    });
    createWebsocket(id);
}

$(document).ready(() => {
    $.ajax({
        url: '/api/servers',
        method: 'GET',
        error: (e) => {
            console.error(e);
        },
        success: (data) => {
            $('#loading-text').addClass('fade-transparent');
            $('#servers').removeClass('fade-transparent');
            for (const server of data) {
                initializeServer(server);
            }
        }
    });

    setInterval(() => {
        for (const server of servers) {
            if (server.status === 2) {
                sendPing(server.ws);
            }
        }
    }, 5000);
});