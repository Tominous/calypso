const Discord = require('discord.js'),
    exec = require('child_process').exec,
    config = require("./config.json"),
    shutdown = require('./shutdown'),
    logger = require('./logger'),
    permissions = require('./permissions'),
    player = require('./music/musicPlayer'),
    figlet = require('figlet'),
    ping = require("./ping/ping"),
    request = require('request'),
    stats = require('./stats/stats');

let errorUsage = function (usage, callback) {
    let embed = new Discord.RichEmbed().setColor("#ff0008");
    embed.addField("Error", "Wrong usage!", true);
    embed.addField("Correct Usage", usage, true);

    callback(embed);
};

let findUser = function(client, argument) {
    return new Promise(function (resolve, reject) {
        let id = argument.toString().replace("<", "").replace(">", "").replace("@", "").replace("!", "");
        client.fetchUser(id).then(user => {
            resolve(user);
        }).catch(function() {
            reject(new Error("Failed query."));
        })
    });
};

let handler = {};


let commands = [
    {
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

            response += "\n```\nFor more head to https://calypsobot.com/";
            message.author.send(response);
            if (message.channel instanceof Discord.TextChannel) {
                message.reply("Commands have been sent to your DMs");
            }
        }
    },
    {
        name: "join",
        description: "Joins voice channel.",
        parameters: [],
        handle: function(message, params, client) {
            player.join(message, message.channel, client)
        }
    },
    {
        name: "leave",
        description: "Leaves voice channel.",
        parameters: [],
        handle: function(message, params, client) {
            player.leave(message, message.channel, client);
        }
    },
    {
        name: "play",
        description: "Searches for a video on youtube and adds it to the queue.",
        parameters: ["query"],
        handle: function(message, params, client) {
            player.play(message, message.channel, client);
        }
    },
    {
        name: "skip",
        description: "Skips the current song and plays the next one on the queue.",
        parameters: [],
        handle: function(message, params, client) {
            player.skip(message, message.channel, client);
        }
    },
    {
        name: "queue",
        description: "Sends the queue list in chat.",
        parameters: [],
        handle: function(message, params, client) {
            player.queue(message, message.channel, client);
        }
    },
    {
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
    },
    {
        name: "fetch-git",
        description: "Pulls the latest source from git (Admin only).",
        parameters: [],
        handle: function(message, params, client) {
            permissions.hasPermission(message.author, client.mongo).then(res => {
                if (!res) {
                    message.reply(":shield: No permissions. Only bot owners can execute this command.");
                    logger.logPermissionFailed(message, message.author, client.mongo);
                } else {
                    message.channel.send(":satellite_orbital: Fetching latest `git source`").then(gitMessage => {
                        exec("git pull", function (err, stdout, sterr) {
                            if (err !== null) {
                                gitMessage.edit(":x: Failed to download latest update!");
                                console.log(err);
                            } else {
                                if (stdout.toString().indexOf("Already up-to-date.") > -1) {
                                    gitMessage.edit(":gem: Already up to date with git source!");
                                } else {
                                    gitMessage.edit(":white_check_mark: Downloaded latest version! Restarting now.");
                                    shutdown.shutdown(client);
                                    setTimeout(function () {
                                        process.exit(1);
                                    }, 2000);
                                }
                            }
                        });
                    });
                }
            }).catch(function () {
                message.reply(":x: Permission check failed, try again later.");
            });
        }
    },
    {
        name: "ping",
        description: "Pings the servers that calypso depends on.",
        parameters: [],
        handle: function(message, params, client) {
            ping.ping(message, message.channel);
        }
    },
    {
        name: "8ball",
        description: "It's a magic ball, what do you expect it to do?",
        parameters: ["question"],
        handle: function(message, params, client) {
            let responses = ["Yes", "No", "My sources point to...yes", "My sources point to...no", "You f****** know it!", "No! What is wrong with you?"];
            let response = responses[Math.floor(Math.random() * responses.length)];
            message.reply(":8ball: " + response);
        }
    },
    {
        name: "permissions",
        description: "Permissions manager. (Admin only).",
        parameters: ["option", "target"],
        handle: function (message, params, client) {
            permissions.hasPermission(message.author, mongo).then(res => {
                if (!res) {
                    message.reply(":shield: No permissions. Only bot owners can execute this command.");
                    logger.logPermissionFailed(message, author, mongo);
                } else {
                    let command = params[0];
                    let target = params[1];
                    switch (command) {
                        case "add":
                            client.fetchUser(target).then(fetchedUser => {
                                permissions.addOwner(fetchedUser, mongo).then(() => {
                                    message.reply(":gem: Gave permissions.");
                                }).catch(function() {
                                    message.reply(":x: Failed to give permissions!");
                                });
                            }).catch(function() {
                                message.reply("Failed to find user.");
                            });
                            break;
                        case "check":
                            permissions.hasPermission(client.fetchUser(target), mongo).then(res => {
                                message.reply("Permissions check returned " + res);
                            }).catch(function () {
                                message.reply("Failed to find user.");
                            });
                            break;
                        case "remove":
                            message.reply("TODO");
                            break;
                        default:
                            errorUsage("~permissions <add|check|remove> <@user>", function(embed) {
                                message.channel.send(embed);
                            });
                            break;
                    }
                }
            }).catch(function() {
                message.reply(":x: Permissions check failed, try again later.");
            });
        }
    },
    {
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
    },
    {
        name: "stats",
        description: "Shows the statistics for Calypso.",
        parameters: [],
        handle: function(message, params, client) {
            let embed = new Discord.RichEmbed();
            console.log(client.guilds.array());
            embed.setTitle(":pencil: Statistics").setColor("#259c28");
            embed.addField("Uptime", "• Client: " + (process.uptime() + "").toHHMMSS() + "\n• Host: " + (require('os').uptime() + "").toHHMMSS(), true);
            embed.addField("General Stats", "• Guild Count: " + client.guilds.array().length + "\n• Users: " + count, true);
            embed.addField("Other Data", "• Node Version: v7.8.0\n• Discord.JS: v11.1.0\n• Calypso: 1.1");
            embed.setTimestamp();
            message.channel.sendEmbed(embed);
        }
    }
];

handler.commands = ["help", "join", "leave", "play", "skip", "volume", "queue", "fetch-git", "8ball", "permissions", "find-id", "slap"];
handler.ownercommands = ["fetch-git","permissions", "find-id"];

handler.findCommand = function(command) {
    for (let i = 0; i < commands.length; i++) {
        if (commands[i].name === command.toLowerCase()) {
            return commands[i];
        }
    }

    return false;
};

handler.handleCommand = function(message, text, client) {
    const params = text.split(" ");
    const command = handler.findCommand(params[0]);

    if (command) {
        if (params.length - 1 < command.parameters.length) {
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

handler.handle = function (message, content, author, member, channel, client, mongo) {
    let cmd = content[0].replace("~", "");

    switch (cmd) {
        case "slap":
            let arguments = content.slice(1);
            if (arguments.length > 1) {
                errorUsage("~slap <@user>", function(embed) {
                    channel.sendMessage(embed);
                });
                break;
            }

            findUser(client, arguments[0]).then(found => {
                permissions.hasPermission(found, mongo).then(res => {
                    if (res) {
                        channel.sendMessage(author + " is slapped even harder. Can't slap that user. :grin:")
                    } else {
                        channel.sendMessage(author + " Slaps " + found + ". :weary: :sweat_drops: ");
                    }
                }).catch(function() {
                   channel.sendMessage(author + "There was an issue slapping " + found);
                });
            }).catch(function() {
                channel.sendMessage(author + " There was an error!");
            });
            break;
    }
};

module.exports = handler;
