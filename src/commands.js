const Discord = require('discord.js'),
    ytdl = require("ytdl-core"),
    ytSearch = require("youtube-search"),
    exec = require('child_process').exec,
    config = require("./config.json"),
    shutdown = require('./shutdown'),
    logger = require('./logger'),
    permissions = require('./permissions'),
    player = require('./music/musicPlayer');

let ytOpts = {
    maxResults: 1,
    key: config.apis.youtube
};

let errorUsage = function (usage, callback) {
    let embed = new Discord.RichEmbed().setColor("#ff3535");
    embed.addField("Error", "Wrong usage!", true);
    embed.addField("Correct Usage", usage, true);

    callback(embed);
};

let appendMethod = function (dispatcher, channel, client) {
    dispatcher.on("end", () => {
        if (client.voiceDispatchers[channel.guild.id] === undefined) {
            return;
        }

        if (client.guildQueues[channel.guild.id].length > 0) {
            let shifted = client.guildQueues[channel.guild.id].shift();
            let dispatcher = client.voiceConnections[channel.guild.id].playStream(ytdl(shifted.link, {filter: 'audioonly'}), {
                seek: 0,
                volume: 1
            });
            let embed = new Discord.RichEmbed().setTitle(shifted.title).setURL(shifted.link);
            embed.addField("Description", shifted.description);

            channel.sendMessage(":musical_note: **Now playing:**");
            channel.sendEmbed(embed).catch(function () {
                console.log("Promise failed, sending default message");
                channel.sendMessage(shifted.title);
            });

            client.voiceDispatchers[channel.guild.id] = dispatcher;
            appendMethod(dispatcher, channel, client);
        } else {
            client.voiceDispatchers[channel.guild.id] = undefined;
        }
    });
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
            let response = "**Available Commands:**\n";
            response += "```";

            for (let i = 0; i < commands.length; i++) {
                let c = commands[i];
                response += "\n~" + c.name;

                for (let j = 0; j < c.parameters.length; j++) {
                    response += " <" + c.parameters[j] + ">";
                }

                response += " : " + c.description;
            }

            response += "\n```";
            message.author.sendMessage(response);
            message.reply("Commands have been sent to your DMs");
        }
    },
    {
        name: "join",
        description: "Joins voice channel",
        parameters: [],
        handle: function(message, params, client) {
            player.join(message, message.channel, client)
        }
    },
    {
        name: "leave",
        description: "Leaves voice channel",
        parameters: [],
        handle: function(message, params, client) {
            player.leave(message, message.channel, client);
        }
    },
    {
        name: "play",
        description: "Searches for a video on youtube and adds it to the queue",
        parameters: ["query"],
        handle: function(message, params, client) {
            player.play(message, message.channel, client);
        }
    },
    {
        name: "skip",
        description: "Skips the current song and plays the next one on the queue",
        parameters: [],
        handle: function(message, params, client) {
            player.skip(message, message.channel, client);
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
            message.reply("Not enough arguments");
        } else {
            command.handle(message, params, client);
        }
    }
};

handler.handle = function (message, content, author, member, channel, client, mongo) {
    let cmd = content[0].replace("~", "");

    switch (cmd) {
        case "queue":
            if (client.voiceChannels[channel.guild.id] === undefined) {
                channel.sendMessage(author + " I'm not on a channel. Do ~join first!");
                return;
            }

            if (client.guildQueues[channel.guild.id].length > 0) {
                let msg = "```\n";
                let counter = 0;
                for (let que in client.guildQueues[channel.guild.id]) {
                    counter++;
                    let m = client.guildQueues[channel.guild.id][que];
                    let actualMessage = "#" + counter + " " + m.title;
                    msg += actualMessage + "\n";
                }
                msg += "```";
                channel.sendMessage(msg);
            } else {
                channel.sendMessage(author + " Nothing on the queue! Do ~play to add some music to the queue!");
            }
            break;
        case "fetch-git":
            permissions.hasPermission(author, mongo).then(res => {
                if (!res) {
                    channel.sendMessage(author + " :shield: No permissions. Only bot owners can execute this command.");
                    logger.logPermissionFailed(message, author, mongo);
                } else {
                    channel.sendMessage(":satellite_orbital: Fetching latest `git source`").then(gitMessage => {
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
                channel.sendMessage(":x: Permission check failed, try again later.");
            });
            break;
        case "8ball":
            let question = content.slice(1);
            if (question.length <= 0) {
                errorUsage("~8ball <question>", function (embed) {
                    channel.sendEmbed(embed);
                });
                break;
            }

            let responses = ["Yes", "No", "My sources point to...yes", "My sources point to...no", "You f****** know it!", "No! What is wrong with you?"];
            let response = responses[Math.floor(Math.random() * responses.length)];
            channel.sendMessage(":8ball: " + author + " " + response);
            break;
        case "find-id":
            permissions.hasPermission(author, mongo).then(res => {
                if (!res) {
                    channel.sendMessage(author + " :shield: No permissions. Only bot owners can execute this command.");
                    logger.logPermissionFailed(message, author, mongo);
                } else {
                    let findArgs = content.slice(1);
                    if (findArgs.length !== 1) {
                        errorUsage("~find-id <@user>", function(embed) {
                            channel.sendEmbed(embed);
                        });
                    }

                    let findTarget = findArgs[0].toString().replace("<", "").replace(">", "").replace("@", "").replace("!", "");
                    channel.sendMessage(author + " " + findTarget);
                }
            }).catch(function() {
                channel.sendMessage(":x: Permission check failed, try again later.");
            });
            break;
        case "permissions":
            permissions.hasPermission(author, mongo).then(res => {
                if (!res) {
                    channel.sendMessage(author + " :shield: No permissions. Only bot owners can execute this command.");
                    logger.logPermissionFailed(message, author, mongo);
                } else {
                    let arguments = content.slice(1);
                    if (arguments.length !== 2) {
                        errorUsage("~permissions <add|check|remove> <@user>", function(embed) {
                            channel.sendEmbed(embed);
                        });
                        return;
                    }

                    let command = arguments[0];
                    let target = arguments[1];
                    switch (command) {
                        case "add":
                            client.fetchUser(target).then(fetchedUser => {
                                permissions.addOwner(fetchedUser, mongo).then(() => {
                                    channel.sendMessage(":gem: Gave permissions.")
                                }).catch(function() {
                                    channel.sendMessage("Failed to give permissions!");
                                });
                            }).catch(function() {
                                channel.sendMessage(author + " Failed to find user.");
                            });
                            break;
                        case "check":
                            permissions.hasPermission(client.fetchUser(target), mongo).then(res => {
                                channel.sendMessage("Permissions check returned " + res);
                            }).catch(function () {
                                channel.sendMessage(author + " Failed to find user.");
                            });
                            break;
                        case "remove":
                            channel.sendMessage("TODO");
                            break;
                        default:
                            errorUsage("~permissions <add|check|remove> <@user>", function(embed) {
                                channel.sendEmbed(embed);
                            });
                            break;
                    }
                }
            }).catch(function() {
                channel.sendMessage(":x: Permission check failed, try again later.");
            });
            break;
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
