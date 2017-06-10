const Discord = require('discord.js'),
    client = new Discord.Client(),
    cmdHandler = require("./commands"),
    config = require("./config.json"),
    toobusy = require("toobusy-js"),
    MongoClient = require("mongodb").MongoClient,
    permissions = require("./permissions/permissions"),
    chatbot = require('./chat/chatbot');

const token = config.bot.token;
let mongo = undefined;

let starter = "~";

client.on("ready", () => {
    console.log("[STARTUP] Calypso is now up and running!");

    MongoClient.connect(config.database.url, function (err, db) {
        if (err !== null) {
            console.log("[ERROR] Failed to boot.");
            process.exit(1);
        } else {
            mongo = db;
            console.log("[DB] Connected to Mongo");

            client.mongo = mongo;

            client.user.setUsername("Calypso");
            client.user.setGame("~help");

            client.voiceChannels = {};
            client.voiceDispatchers = {};
            //noinspection JSAnnotator
            client.voiceConnections = {};
            client.guildQueues = {};

            console.log("Bot is currently in " + client.guilds.array().length + " guilds!");

            for (let k in client.guilds.array()) {
                let guild = client.guilds.array()[k];
                mongo.collection("guilds").updateOne({
                        "guildId": guild.id
                    }, {
                        "guildId": guild.id,
                        "region": guild.region,
                        "joinedAt": guild.joinedAt,
                        "guildName": guild.name,
                        "owner": guild.ownerID
                    },
                    {
                        upsert: true
                    }, function (err, object) {
                        if (err) {
                            console.log(err);
                        }
                    });

                permissions.updateGuild(client, guild).then(object => {
                }).catch(err => {
                    console.log(err);
                });
            }

            mongo.collection("received_messages").find({}).each(function(err, object) {
                let message = object.message;
                chatbot.trainBrain(message);
            });
        }
    });
});

client.on("message", message => {
    if (!message.content.startsWith(starter)) {
        mongo.collection("received_messages").insertOne({
            "author": message.author.username,
            "authorId": message.author.id,
            "timetamp": new Date().getTime(),
            "message": message.content
        }, function(err, result) {
            if (err) {
                console.log(err);
            }
        });
        chatbot.trainBrain(message);
        return;
    }

    if (toobusy()) {
        message.channel.send(message.author + " I'm currently under too much load. Please wait a couple of minutes. :dissapointed:");
        return;
    }

    let content = message.content.split(" ");
    if (message.channel instanceof Discord.DMChannel) {
        mongo.collection("messages").insertOne({
            "author": message.author.username,
            "authorId": message.author.id,
            "timestamp": new Date().getTime(),
            "splitMessage": content,
            "message": message.content,
            "dm": true,
            "avatar": message.author.avatarURL
        }, function (err, result) {
            if (err !== null) {
                console.log(err);
            }
        });
    } else {
        mongo.collection("messages").insertOne({
            "author": message.author.username,
            "authorId": message.author.id,
            "guild": message.guild.id,
            "timestamp": new Date().getTime(),
            "region": message.guild.region,
            "splitMessage": content,
            "message": message.content,
            "avatar": message.author.avatarURL
        }, function (err, result) {
            if (err !== null) {
                console.log(err);
            }
        });
    }

    cmdHandler.handleCommand(message, message.content.substring(1), client);
});

client.on("guildCreate", guild => {
    mongo.collection("guilds").updateOne({
            "guildId": guild.id
        }, {
            "guildId": guild.id,
            "region": guild.region,
            "joinedAt": guild.joinedAt,
            "guildName": guild.name,
            "owner": guild.ownerId
        },
        {
            upsert: true
        }, function (err, object) {

        });
    permissions.updateGuild(client, guild).then(object => {
    }).catch(err => {
        console.log(err);
    });
});

client.on("guildUpdate", (oldGuild, newGuild) => {
    mongo.collection("guilds").updateOne({
            "guildId": oldGuild.id
        }, {
            "guildId": newGuild.id,
            "region": newGuild.region,
            "joinedAt": newGuild.joinedAt,
            "guildName": newGuild.name,
            "owner": newGuild.ownerId
        },
        {
            upsert: true
        }, function (err, object) {

        });

    permissions.updateGuild(client, newGuild).then(object => {
        console.log("Updated guild")
    }).catch(err => {
        console.log(err);
    });
});

String.prototype.toHHMMSS = function () {
    let sec_num = parseInt(this, 10); // don't forget the second param
    let remainder = sec_num % 86400;

    let days = Math.floor(sec_num / 86400);
    let hours = Math.floor(remainder / 3600);
    let minutes = Math.floor((remainder / 60) - (hours * 60));
    let seconds = Math.floor((remainder % 3600) - (minutes * 60));

    if (days > 0) {
        return days + "d " + hours + "h " + minutes + "m " + seconds + "s";
    } else if (hours > 0) {
        return hours + "h " + minutes + "m " + seconds + "s";
    } else if (minutes > 0) {
        return minutes + "m " + seconds + "s";
    } else {
        return seconds + "s";
    }
};

client.login(token);
