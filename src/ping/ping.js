const async = require('async'),
    tcpPing = require('tcp-ping');

function getPing(server, port, callback) {
    return function(callback) {
        tcpPing.ping({address: server, port: port, attempts: 3}, function(err, res) {
            callback(err, parseFloat(res.min).toFixed(2));
        });
    }
}

function getPings(callback) {
    async.series([
        getPing("googleapis.com", 80),
        getPing("127.0.0.1", 27017),
        getPing("youtube.com", 80)
    ], function(err, res) {
        console.log(res);
        callback(err, res);
    });
}

module.exports = {
    ping: function(message, channel) {
        getPings(function(err, res) {
            if (err) {
                message.reply("Failed to ping servers.");
            } else {
                channel.send(":cloud: gCloud API Latency: " + res[0]);
                channel.send(":gem: gCloud Compute Engine Latency: " + res[1]);
                channel.send(":play_pause: Youtube Latency: " + res[2]);
            }
        });
    }
};