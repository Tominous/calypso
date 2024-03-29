module.exports = {
    addPermissionNode: function (client, guild, role, permission) {
        return new Promise(function (resolve, reject) {
            let mongo = client.mongo;
            let name = "roles." + role.name;
            let update = {};
            update[name] = permission;
            mongo.collection("guild_permissions").updateOne({
                "guildId": guild.id
            }, {
                $addToSet: update
            }, {
                upsert: true
            }, function (err, object) {
                if (err) {
                    reject(err);
                } else {
                    resolve(object);
                }
            });
        });
    },
    removePermissionNode: function (client, guild, role, permission) {
        return new Promise(function (resolve, reject) {
            let mongo = client.mongo;
            let name = "roles." + role.name;
            let update = {};
            update[name] = permission;
            mongo.collection("guild_permissions").updateOne({
                "guildId": guild.id
            }, {
                $pull: update
            }, {
                upsert: true
            }, function (err, object) {
                if (err) {
                    reject(err);
                } else {
                    resolve(object);
                }
            });
        });
    },
    insertGuild: function (client, guild) {
        return new Promise(function (resolve, reject) {
            let mongo = client.mongo;
            let roles = {};
            for (let r in guild.roles.array()) {
                let role = guild.roles.array()[r];
                roles[role.name] = [];
            }
            mongo.collection("guild_permissions").updateOne({
                "guildId": guild.id
            }, {
                $set: {
                    "guildId": guild.id,
                    roles: roles
                }
            }, {
                upsert: true
            }, function (err, object) {
                if (err) {
                    reject(err);
                } else {
                    resolve(object);
                }
            });
        });
    },
    isGlobalOwner: function (author) {
        return new Promise(function (resolve, reject) {
            if (author.id === "145231371118313472" || author.id === "128286074769375232") {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    },
    hasPermission: function (author, node, message, client) {
        return new Promise(function (resolve, reject) {
            if (message.guild.ownerId === author.id) {
                resolve(true);
            } else {
                let mongo = client.mongo;
                message.guild.fetchMember(author).then(user => {
                    for (let k in user.roles.array()) {
                        let role = user.roles.array()[k];
                        let name = "roles." + role.name;
                        let query = {"guildId": message.guild.id};
                        query[name] = node;
                        console.log(query);
                        mongo.collection("guild_permissions").findOne(query, function (err, object) {
                            if (err) {
                                reject(false);
                            } else {
                                if (object !== null && object !== undefined) {
                                    resolve(true);
                                } else {
                                    resolve(false);
                                }
                            }
                        })
                    }
                });
            }
        });
    },
    roleHasPermission: function (node, role, message, client) {
        return new Promise(function (resolve, reject) {
            let mongo = client.mongo;
            let name = "roles." + role.name;
            let query = {"guildId": message.guild.id};
            query[name] = node;
            mongo.collection("guild_permissions").findOne(query, function (err, object) {
                if (err) {
                    reject(false);
                } else {
                    if (object !== null && object !== undefined) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                }
            });
        });
    }
};