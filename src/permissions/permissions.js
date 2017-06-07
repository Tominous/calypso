module.exports = {
    addPermissionNode: function(client, guild, role, permission) {
        return new Promise(function(resolve, reject) {
            let mongo = client.mongo;
            let name = "roles." + role.name + ".permissions";
            let update = {};
            update[name] = permission;
            mongo.collection("guild_permissions").updateOne({
                "guildId": guild.id
            }, {
                $addToSet: update
            }, {
                upsert: true
            }, function(err, object) {
                if (err) {
                    reject(err);
                } else {
                    resolve(object);
                }
            });
        });
    },
    updateGuild: function(client, guild) {
        return new Promise(function(resolve, reject) {
            let mongo = client.mongo;
            let roles = {};
            for (let r in guild.roles.array()) {
                let role = guild.roles.array()[r];
                roles[role.name] = [];
            }
            console.log(roles);
            mongo.collection("guild_permissions").updateOne({
                "guildId": guild.id
            }, {
                roles: roles
            }, {
                upsert: true
            }, function(err, object) {
                if (err) {
                    reject(err);
                } else {
                    resolve(object);
                }
            });
        });
    },
    isGlobalOwner: function(author) {
        return new Promise(function(resolve, reject) {
            if (author.id === "145231371118313472" || author.id === "128286074769375232") {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    }
};