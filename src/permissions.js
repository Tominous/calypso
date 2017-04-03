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
                }, function(err, object) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(object);
                    }
                });
        });
    },
    hasPermission: function (user, mongo) {

    }
};