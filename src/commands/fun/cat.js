const request = require('request')

module.exports = {
    name: "cat",
    description: "Sends a picture of a random cat.",
    parameters: [],
    handle: function(message, params, client) {
        request('http://random.cat/meow', function(error, response, body) {
            if (error) {
                message.reply(":cat: Failed to find pus pus :(");
            } else {
                let json = JSON.parse(body);
                let url = json.file;
                message.reply(":cat: " + url);
            }
        })
    }
}