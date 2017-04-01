const Discord = require('discord.js');
const client = new Discord.Client();
const cmdHandler = require("./commands");
const yt = require("youtube-search");

var ytOpts = {
  maxResults: 1,
  key: "AIzaSyAKjDQOtjKq0NMkD31P07TohtcsrFCLkrE"
};

const token = "Mjc1Mzk4MDk1NDQ4MTc4Njg4.C3AEBQ.oWR5i4lTrjadTUwQWgRBQN1Uq30";

let starter = "~";

client.on("ready", () => {
  console.log("[STARTUP] Calypso is now up and running!");

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

  let content = message.content.split(" ");
  var inr = cmdHandler.commands.indexOf(content[0].replace("~", ''));
  if (inr == -1) {
    message.channel.sendMessage(message.author + " Command not found! Use ~help for a list of commands.");
    return;
  } else {
    cmdHandler.handle(message, content, message.author, message.member, message.channel, client);
  }
});

client.login(token);
