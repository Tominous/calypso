const Discord = require('discord.js'),
    client = new Discord.Client(),
    cmdHandler = require("./commands"),
    config = require("./config.json"),
    toobusy = require("toobusy-js"),
    MongoClient = require("mongodb").MongoClient;

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

            for (let k in client.guilds) {
                let guild = client.guilds[k];
                mongo.collection("guilds").updateOne({
                        "guild": guild.id
                    }, {
                        "guild": guild.id,
                        "region": guild.region,
                        "joinedAt": guild.joinedAt
                    },
                    {
                        upsert: true
                    }, function (err, object) {

                    });
            }
        }
    });
});

client.on("message", message => {
    if (!message.content.startsWith(starter)) {
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
            "guild": guild.id
        }, {
            "guild": guild.id,
            "region": guild.region,
            "joinedAt": guild.joinedAt
        },
        {
            upsert: true
        }, function (err, object) {

        });
});

String.prototype.toHHMMSS = function () {
    let sec_num = parseInt(this, 10); // don't forget the second param
    let hours   = Math.floor(sec_num / 3600);
    let minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    let seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return hours + ':' + minutes + ':' + seconds;
};

client.login(token);
