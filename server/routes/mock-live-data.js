const ws = require('ws');

// OLD Ref app:
// wss://release-oct-20-websocket-server.run.aws-usw02-pr.ice.predix.io/livestream/Compressor-2015:CompressionRatio
// {"name":"Compressor-2015:CompressionRatio","datapoints":[[1490043819965,2.6873587396621494]],"attributes":{"assetId":"compressor-2015","sourceTagId":"CompressionRatio"}}

// hardcode thresholds for demonstration:
const thresholds = {
    "Compressor-CMMS-Compressor-2018:CompressionRatio": [2.5, 3],
    "Compressor-CMMS-Compressor-2018:DischargePressure": [0, 23],
    "Compressor-CMMS-Compressor-2018:SuctionPressure": [0, 0.21],
    "Compressor-CMMS-Compressor-2018:MaximumPressure": [22, 26],
    "Compressor-CMMS-Compressor-2018:Velocity": [0, 0.07],
    "Compressor-CMMS-Compressor-2018:Temperature": [65, 80]
};

function getRandomData(tag) {
    let threshold = thresholds[tag] || thresholds['Compressor-CMMS-Compressor-2018:CompressionRatio'];
    let range = (threshold[1] - threshold[0]) * 1.2;
    let low = threshold[0] - ((threshold[1] - threshold[0]) * 0.1);
    let value = Math.random() * range + low;
    return JSON.stringify({"name": tag, "datapoints": [[(new Date()).getTime(), value]]});
}

function createWebSocketServer(httpServer) {
    const wsServer = new ws.Server({server: httpServer});

    wsServer.on('connection', function connection(socket, req) {
        console.log('connection opened: ', req.url);
        let path = req.url || "";
        if (path === "" || path === "/") {
            path = "/Compressor-CMMS-Compressor-2018:CompressionRatio";
        } 
        const tagName = path.substring(path.lastIndexOf("/") + 1);
        console.log('web socket opened for tag:', tagName);
        // send one datapoint right away:
        socket.send(getRandomData(tagName));
        let intervalId = setInterval(function() {
            if (socket.readyState === socket.OPEN) {
                socket.send(getRandomData(tagName));
            }
        }, 1000);
        // socket.on('message', function incoming(msg) {
        //     console.log('received message:', msg);
        // });
        socket.on('close', function() {
            console.log('web socket closed');
            clearInterval(intervalId);
        })        
    });
}

module.exports = createWebSocketServer;