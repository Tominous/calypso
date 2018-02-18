const {commands} = require('../../commands')

module.exports = {
    name: "help",
    description: "Displays this message.",
    parameters: [],
    handle: function(message, params, client) {
        let response = "```asciidoc\n= Commands =";

        for (let i = 0; i < commands.length; i++) {
            let c = commands[i];
            response += "\n~" + c.name;

            for (let j = 0; j < c.parameters.length; j++) {
                response += " <" + c.parameters[j] + ">";
            }

            response += " :: " + c.description;
        }

        response += "\n```\nFor more head to http://calypsobot.com/";
        message.author.send(response);
        if (message.channel instanceof Discord.TextChannel) {
            message.reply("Commands have been sent to your DMs");
        }
    }
}