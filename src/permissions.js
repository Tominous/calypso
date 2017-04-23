module.exports = {
    addOwner: function (user, mongo) {
        return new Promise(function (resolve, reject) {
            mongo.collection("permissions").updateOne({
                    "_id": "permissions-object"
                }, {
                    $addToSet: {
                        owners: {
                            id: user.id
                        }
                    }
                },
                {
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
    hasPermission: function (user, mongo) {
        return new Promise(function(resolve, reject) {
            if (user.id === "128286074769375232") {
                resolve(true);
            } else {
                mongo.collection("permissions").findOne(
                    {}, {
                        owners: {
                            $elemMatch: {
                                id: user.id
                            }
                        }
                    }, function (err, object) {
                        if (err) {
                            reject(err);
                        } else {
                            if (object !== null && object !== undefined) {
                                if (object._id !== "permissions-object") {
                                    resolve(true);
                                } else {
                                    resolve(false);
                                }
                            } else {
                                resolve(false);
                            }
                        }
                    });
            }
        });
    }
};