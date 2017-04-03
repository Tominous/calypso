module.exports = {
    addOwner: function (user, mongo) {
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
            });
    },
    hasPermission: function (user, mongo) {

    }
};