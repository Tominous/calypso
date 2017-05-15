const Discord = require('discord.js'),
    ytdl = require("ytdl-core"),
    ytSearch = require("youtube-search"),
    exec = require('child_process').exec,
    config = require("../config.json"),
    shutdown = require('./shutdown'),
    logger = require('./logger'),
    permissions = require('./permissions');

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
        handle: function(message, params) {
            message.author.sendMessage("Helperoni!");
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

handler.handleCommand = function(message, text) {
    const params = text.split(" ");
    const command = handler.findCommand(params[0]);

    if (command) {
        if (params.length - 1 < command.parameters.length) {
            message.reply("Not enough arguments");
        } else {
            command.handle(message, params);
        }
    }
};

handler.handle = function (message, content, author, member, channel, client, mongo) {
    let cmd = content[0].replace("~", "");
    let finalChannel = undefined;

    switch (cmd) {
        case "help":
            let embed = new Discord.RichEmbed().setTitle("------ > HELP < ------");

            embed.addField("- Commands", handler.commands.join(", "));
            embed.addField("- Owner Commands", handler.ownercommands.join(", "));

            channel.sendEmbed(embed);
            break;
        case "join":
            for (let c of channel.guild.channels) {
                let realC = c[1];
                if (realC instanceof Discord.VoiceChannel) {
                    if (realC.id === member.voiceChannelID) {
                        finalChannel = realC;
                        break;
                    }
                }
            }

            if (finalChannel === undefined) {
                channel.sendMessage(author + " You're not in a voice channel!");
                return;
            }

            finalChannel.join().then(connection => {
                channel.sendMessage(author + " Joined " + finalChannel.name + ". Now ready to play music.");

                client.voiceChannels[channel.guild.id] = finalChannel;
                client.voiceConnections[channel.guild.id] = connection;
                client.guildQueues[channel.guild.id] = [];

                mongo.collection("voice_log").insertOne({
                    "guild": message.guild.id,
                    "region": message.guild.region,
                    "joined_at": new Date().getTime()
                });
            });
            break;
        case "leave":
            if (client.voiceChannels[channel.guild.id] === undefined) {
                channel.sendMessage(author + " I'm not connected to a voice channel!");
                return;
            }

            channel.sendMessage(author + " Left " + client.voiceChannels[channel.guild.id].name);
            client.voiceChannels[channel.guild.id].leave();
            client.voiceChannels[channel.guild.id] = undefined;
            client.voiceDispatchers[channel.guild.id] = undefined;
            client.voiceConnections[channel.guild.id] = undefined;
            client.guildQueues[channel.guild.id] = undefined;

            break;
        case "play":
            if (client.voiceChannels[channel.guild.id] === undefined) {
                channel.sendMessage(author + " I'm not on a channel. Do ~join first!");
                return;
            }

            let search = content.slice(1);
            if (search.length <= 0) {
                errorUsage("~play <name of video>", function (embed) {
                    channel.sendEmbed(embed);
                });
                return;
            }
            let realSearch = search.join(" ");
            ytSearch(realSearch, ytOpts, function (err, results) {
                if (err !== null) {
                    console.log(err);
                    channel.sendMessage(author + " There was an error! Please contact @Erik#9933 about this issue.");
                    return;
                }

                if (results.length <= 0) {
                    channel.sendMessage(author + " No videos found! Try a diferent query?");
                    return;
                }

                let result = results[0];

                if (client.guildQueues[channel.guild.id].length > 0 || client.voiceDispatchers[channel.guild.id] !== undefined) {
                    client.guildQueues[channel.guild.id].push(result);

                    let embed = new Discord.RichEmbed().setTitle(result.title).setURL(result.link);
                    embed.addField("Description", result.description);

                    channel.sendMessage(author + " Queued (" + client.guildQueues[channel.guild.id].length + "): ");
                    channel.sendEmbed(embed).catch(function () {
                        console.log("Promise failed, sending default queue message");
                        channel.sendMessage(result.title);
                    });
                    return;
                }

                try {
                    let dispatcher = client.voiceConnections[channel.guild.id].playStream(ytdl(result.link, {filter: 'audioonly'}), {
                        seek: 0,
                        volume: 1
                    });

                    let embed = new Discord.RichEmbed().setTitle(result.title).setURL(result.link);
                    embed.addField("Description", result.description);
                    if (result.thumbnails['high'] !== null || result.thumbnails['high'] !== undefined) {
                        embed.setThumbnail(result.thumbnails['high'].url);
                    }

                    channel.sendMessage(":musical_note: **Now playing:** ");
                    channel.sendEmbed(embed).catch(function () {
                        console.log("Promise failed, sending default message");
                        channel.sendMessage(result.title);
                    });

                    client.voiceDispatchers[channel.guild.id] = dispatcher;
                    appendMethod(dispatcher, channel, client);
                } catch (exception) {
                    channel.sendMessage(":x: Failed to query. Contact @Erik#9933");
                    console.log(exception);
                }
            });

            break;
        case "skip":
            if (client.voiceChannels[channel.guild.id] === undefined) {
                channel.sendMessage(author + " I'm not on a channel. Do ~join first!");
                return;
            }

            if (client.voiceDispatchers[channel.guild.id] === undefined) {
                channel.sendMessage(author + " I'm not playing anything!");
                return;
            }

            channel.sendMessage(author + " :x: Skipped song.");
            client.voiceDispatchers[channel.guild.id].end();
            break;
        case "volume":
            if (client.voiceChannels[channel.guild.id] === undefined) {
                channel.sendMessage(author + " I'm not on a channel. Do ~join first!");
                return;
            }

            if (client.voiceDispatchers[channel.guild.id] === undefined) {
                channel.sendMessage(author + " I'm not playing anything!");
                return;
            }

            channel.sendMessage(author + " We removed support for the volume command. To use it just change the Discord volume for the bot!");
            break;
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
