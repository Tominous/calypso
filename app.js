const {ShardingManager} = require('discord.js');
const Manager = new ShardingManager('../src/calypso.js');

Manager.spawn(2).then(col => {
}).catch(err => console.log(err));

process.on('unhandledRejection', err => console.error(err));