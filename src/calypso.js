const Discord = require('discord.js'),
    client = new Discord.Client(),
    cmdHandler = require("./commands"),
    config = require("../config.json"),
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
        }
    });

    client.user.setUsername("Calypso");
    client.user.setGame("~help");

    client.voiceChannels = {};
    client.voiceDispatchers = {};
    client.voiceConnections = {};
    client.guildQueues = {};
});

client.on("message", message => {
    if (!message.content.startsWith(starter)) {
        return;
    }

    if (message.channel instanceof Discord.DMChannel) {
        return;
    }

    if (toobusy()) {
        message.channel.sendMessage(message.author + " I'm currently under too much load. Please wait a couple of minutes. :dissapointed:");
        return;
    }

    let content = message.content.split(" ");
    mongo.collection("messages").insertOne({
        "author": message.author,
        "authorId": message.author.id,
        "guild": message.guild.id,
        "timestamp": new Date().getTime(),
        "region": message.guild.region,
        "splitMessage": content,
        "message": message.content
    }, function (err, result) {
        if (err !== null) {
            console.log(err);
        }
    });

    cmdHandler.handleCommand(message, message.content.substring(1));
});

client.login(token);
