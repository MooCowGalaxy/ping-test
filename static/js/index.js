const servers = []; // {name, serverName, domain, ws, status, ping}
const backgroundColors = ['bg-red-400', 'bg-amber-400', 'bg-green-400'];
const textColors = ['text-red-400', 'text-amber-400', 'text-green-400'];
let interval;

function updateOnlineCount() {
    const onlineCountSpan = $('#online-count');

    const online = servers.filter(server => server.status === 2).length;
    const total = servers.length;

    let color;
    if (online === total) color = 2;
    else if (online > 0) color = 1;
    else color = 0;

    onlineCountSpan.html(`(<span class="${textColors[color]}">${online}/${total}</span> servers online)`);
}
function setPingInterval(seconds = 5) {
    if (interval !== undefined) clearInterval(interval);
    interval = setInterval(() => {
        for (const server of servers) {
            if (server.status === 2) {
                sendPing(server.ws);
            }
        }
    }, seconds * 1000);
}
function sendPing(ws) {
    try {
        ws.send(Date.now().toString());
    } catch (e) {
        console.error(e);
    }
}
function setPing(id, ping) { // null for disconnected, number for ms (-1 for connecting, -2 for N/A)
    const serverName = servers[id].serverName;
    const serverPing = $(`#${serverName}-ping`);

    for (const color of textColors) serverPing.removeClass(color);

    let pingText;
    if (ping === null) pingText = 'Disconnected';
    else if (ping === -1) pingText = 'Connecting';
    else if (ping === -2) pingText = 'N/A';
    else pingText = `${ping}ms`;
    serverPing.text(pingText);

    if (ping !== -2) {
        let color;
        if (ping === null) color = 0;
        else if (ping === -1) color = 1;
        else if (ping < 100) color = 2;
        else if (ping < 250) color = 1;
        else color = 0;
        serverPing.addClass(textColors[color]);
    }

    servers[id].ping = ping;
}
function setStatus(id, status) { // 0: offline, 1: connecting, 2: online
    const serverName = servers[id].serverName;
    const serverStatus = $(`#${serverName}-status`);

    for (const color of backgroundColors) serverStatus.removeClass(color);
    serverStatus.addClass(backgroundColors[status]);
    if (status === 2) setPing(id, -2);

    servers[id].status = status;
    updateOnlineCount();
}
function createWebsocket(id) {
    const server = servers[id];

    // const connectionType = window.location.protocol === 'http:' ? 'ws' : 'wss';
    const connectionType = 'wss';

    const ws = new WebSocket(`${connectionType}://${server.domain}`);
    setStatus(id, 1);
    setPing(id, -1);

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
        <div class="border border-neutral-600 bg-neutral-800 py-1.5 px-4 rounded-full mb-2 flex flex-row justify-between" id="${serverName}">
            <div>
                <span class="bg-red-400 p-2 mr-1 relative top-0.5 rounded-full inline-block" id="${serverName}-status"></span>
                <span class="inline-block">${server.name}</span>
            </div>
            <p class="text-red-400" id="${serverName}-ping"></p>
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
            $('#servers-parent').removeClass('fade-transparent');
            for (const server of data) {
                initializeServer(server);
            }
        }
    });

    $('#interval').on('change', () => {
        setPingInterval(parseInt($('#interval').val()));
    });
    setPingInterval(5);
});