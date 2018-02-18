const Discord = require('discord.js'),
    exec = require('child_process').exec,
    config = require("./config.json"),
    shutdown = require('./shutdown'),
    logger = require('./logger'),
    permissions = require('./permissions/permissions'),
    player = require('./music/musicPlayer'),
    figlet = require('figlet'),
    ping = require("./commands/misc/ping"),
    request = require('request'),
    coin = require('./commands/fun/flipcoin'),
    requireDir = require('require-directory');

let newCommands = []
let com = requireDir(module, './commands')

// register commands
Object.keys(com).forEach(function(key) {
    let value = com[key]
    Object.keys(value).forEach(function(k) {
        let cmd = value[k]
        newCommands[cmd.name.toLowerCase()] = cmd
    })
})

let errorUsage = function (usage, callback) {
    let embed = new Discord.RichEmbed().setColor("#ff0008");
    embed.addField("Error", "Wrong usage!", true);
    embed.addField("Correct Usage", usage, true);

    callback(embed);
}

let findUser = function(client, argument) {
    return new Promise(function (resolve, reject) {
        let id = argument.toString().replace("<", "").replace(">", "").replace("@", "").replace("!", "")
        client.fetchUser(id).then(user => {
            resolve(user)
        }).catch(function() {
            reject(new Error("Failed query."))
        })
    })
}

let handler = {}

let commands = [
    {
        name: "permissions",
        description: "Permissions module, can only be used by administrators.",
        parameters: ["action [add/remove/check]", "node","role"],
        handle: function(message, params, client) {
            if (message.channel instanceof Discord.DMChannel) {
                message.reply("This action can ony be performed in text channels.");
                return;
            }

            let action = params[1];
            let node = params[2];
            let role = params.slice(3).join(" ");
            if (message.author.id === message.guild.ownerID || permissions.isGlobalOwner(message.author)) {
                let actualRole = message.guild.roles.array().filter(rol => {
                    return rol.name.toLowerCase() === role.toLowerCase();
                })[0];
                switch (action.toLowerCase()) {
                    case "add":
                        permissions.addPermissionNode(client, message.guild, actualRole, node).then(obj => {
                            message.reply(":ok_hand: Permission node `" + node + "` given to user group `" + actualRole.name + "`");
                        }).catch(err => {
                            message.reply(":x: Failed to give permissions, please contact a developer.");
                            console.log(err);
                        });
                        break;
                    case "remove":
                        permissions.removePermissionNode(client, message.guild, actualRole, node).then(obj => {
                            message.reply(":ok_hand: Permission node `" + node + "` removed from user group `" + actualRole.name + "`");
                        }).catch(err => {
                            message.reply(":x: Failed to remove permissions, please contact a developer.");
                            console.log(err);
                        });
                        break;
                    case "check":
                        permissions.roleHasPermission(node, actualRole, message, client).then(response => {
                            message.reply(":shield: The role `" + actualRole.name + "` " + (response ? "does" : "does not") + " have the `" + node + "` permission node.");
                        }).catch(err => {
                            message.reply(":x: Failed to check permissions, please contact a developer.");
                            console.log(err);
                        });
                        break;
                    default:
                        message.reply("Wrong action. Please try one of the following: add,remove,check.");
                        break;
                }
            } else {
                message.reply(":x: Access denied, only guild owner can use this command.");
            }
        }
    }
];

handler.handleCommand = function(message, text, client) {
    const params = text.split(" ")
    if (params[0].toLowerCase() === "help") {
        let response = "```asciidoc\n= Commands =";

        Object.keys(newCommands).forEach(k => {
            let c = newCommands[k];
            response += "\n~" + c.name;

            if (c.parameters) {
                for (let j = 0; j < c.parameters.length; j++) {
                    response += " <" + c.parameters[j] + ">";
                }
            }

            response += " :: " + c.description;
        })

        response += "\n```\nFor more head to http://calypsobot.com/";
        message.author.send(response);
        if (message.channel instanceof Discord.TextChannel) {
            message.reply("Commands have been sent to your DMs");
        }
        return;
    }
    const command = newCommands[params[0].toLowerCase()]

    if (command) {
        if (command.parameters && params.length - 1 < command.parameters.length) {
            let usage = "~" + command.name + " ";
            for (let i = 0; i < command.parameters.length; i++) {
                let param = command.parameters[i];
                param = "<" + param + ">";
                usage += param + " ";
            }

            errorUsage(usage, function(embed) {
                message.channel.sendEmbed(embed);
            });
        } else {
            command.handle(message, params, client);
        }
    } else {
        message.reply("Unknown command. Try ~help.");
    }
};

module.exports = handler;
