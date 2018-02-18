const request = require('request')

module.exports = {
    name: "dog",
    description: "Sends a picture of a random dog.",
    parameters: [],
    handle: function(message, params, client) {
        request('https://random.dog/woof.json', function(error, response, body) {
            if (error) {
                message.reply(":dog: Failed to find doggy :(");
            } else {
                let json = JSON.parse(body);
                let url = json.url;
                message.reply(":dog: " + url);
            }
        })
    }
}