const figlet = require('figlet')

module.exports = {
    name: "announce",
    description: "Sends a very large ASCII text of the message.",
    parameters: ["text"],
    handle: function (message, params, client) {
        let text = params.slice(1).join(" ");
        figlet.text(text, {
            font: "Big",
            horizontalLayout: 'default',
            verticalLayout: 'default'
        }, function(err, data) {
            if (err) {
                console.log('Something went wrong...');
                console.dir(err);
                return;
            }
            data = data.replace(/\s*$/,"");
            let mes = "```";
            mes += data;
            mes += "```";
            message.channel.send(mes);
        });
    }
}