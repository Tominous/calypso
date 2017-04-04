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
        if (user.id === "128286074769375232") {
            return true;
        } else {
            mongo.collection("permissions").findOne(
                {}, {
                    owners: {
                        $elemMatch: {
                            id: user.id
                        }
                    }
                }, function (err, object) {
                    console.log(err);
                    console.log(object);
                    return false;
                });
        }
    }
};