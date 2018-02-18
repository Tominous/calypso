const async = require('async'),
    tcpPing = require('tcp-ping');

function getPing(server, port, callback) {
    return function(callback) {
        tcpPing.ping({address: server, port: port, attempts: 3}, function(err, res) {
            callback(err, parseFloat(res.min).toFixed(2) + "ms");
        });
    }
}

function getPings(callback) {
    async.series([
        getPing("googleapis.com", 80),
        getPing("127.0.0.1", 27017),
        getPing("youtube.com", 80)
    ], function(err, res) {
        callback(err, res);
    });
}

module.exports = {
    name: "ping",
    description: "Pings all services",
    handle: function(message, client) {
        channel.send(":satellite_orbital: Pinging services...").then(pingMessage => {
            getPings(function(err, res) {
                if (err) {
                    pingMessage.edit(message.author + ", Failed to ping servers.");
                } else {
                    let mes = "`Pinged Services`\n";
                    mes += ":cloud: gCloud API Latency: " + res[0] + "\n";
                    mes += ":gem: MongoDB Latency: " + res[1] + "\n";
                    mes += ":play_pause: Youtube Latency: " + res[2];
                    pingMessage.edit(mes);
                }
            });
        });
    }
};