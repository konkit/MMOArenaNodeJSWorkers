module.exports = function(db) {
    setInterval(function () {
        var collection = db.collection('fightRequests');

        collection.count({fightState: "PENDING"}, function (err, count) {
            if (err) { throw err; }
            
            if (count < 2) {
                //console.log("No pending fight requests");
                return;
            }

            collection.find({fightState: "PENDING"}, {limit: 2}).toArray(function (err, docs1) {
                if (err) { throw err; }

                if ( !docs1[0]._id || !docs1[1]._id ) {
                    console.log("One of the fightRequest object is null");
                    return;
                }

                var fightCollections = db.collection('fights');
                fightCollections.insert(
                    {
                        player1: docs1[0].playerId,
                        player2: docs1[1].playerId
                    },
                    function(err, result) {
                        if( err ) throw err;

                        console.log( "CREATED FIGHT : " + JSON.stringify(result));

                        var fightId = result[0]._id;

                        collection.update(
                            {
                                _id: docs1[0]._id
                            },
                            {
                                $set: {
                                    fightId : fightId,
                                    fightState: "PREPARED",
                                    enemyId: docs1[1].playerId
                                }
                            },
                            function(err, result) {

                            }
                        );

                        collection.update(
                            {
                                _id: docs1[1]._id
                            },
                            {
                                $set: {
                                    fightId : fightId,
                                    fightState: "PREPARED",
                                    enemyId: docs1[0].playerId
                                }
                            },
                            function(err, result) {

                            }
                        );
                    }
                );
            });
        });

    }, 2000)
}