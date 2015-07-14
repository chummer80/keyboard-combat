Meteor.methods({
	joinGame: function() {
		if (!Meteor.userId()) {
			throw new Meteor.Error("not-authorized");
		}

		// make sure player isn't already in a game
		var gamesWithCurrentUser = Games.find({"players.id": Meteor.userId()});
		console.log("num games with current user: " + gamesWithCurrentUser.count());
		if (gamesWithCurrentUser.count()) {
			throw new Meteor.Error("player id #" + Meteor.userId() + " is already in a game");
		}

		// First look for a game that is waiting for another player.
		var waitingGames = Games.find({status: "waiting"});
		if (waitingGames.count()) {			
			var gameId = waitingGames.fetch()[0]._id;
			Games.update(
				{_id: gameId},
				{
					$addToSet: {players: {
						id: Meteor.userId(),
						name: Meteor.user().profile.name,
						score: 0
					}},
					$set: {status: "playing"}
				},
				{multi: false}
			);
			return gameId;
		}
		// If no game is already waiting, create a new game.
		else {
			return Games.insert({
				players: [{
					id: Meteor.userId(),
					name: Meteor.user().profile.name,
					score: 0
				}],
				status: "waiting",
				winner: null
			});
		}
	},
	leaveGame: function(userId) {
		var gamesWithCurrentUser = Games.find({"players.id": userId});
		if (gamesWithCurrentUser.count()) {
			var game = gamesWithCurrentUser.fetch()[0]
			
			// if this user is the only player in the game, delete the game document.
			if (game.players.length === 1) {
				Games.remove({_id: game._id});
			}
			// otherwise just remove the player from the game document
			else {
				Games.update(
					{"players.id": userId},
					{$pull: {players: userId}},
					{multi: false}
				);
			}
		}
	},
	setScore: function(gameId, playerIndex, newScore) {
		var scoreUpdateObject = {};
		scoreUpdateObject["players." + playerIndex + ".score"] = newScore;
		Games.update(
			{_id: gameId},
			{$set: scoreUpdateObject},
			{multi: false}
		);
	},
	setWinner: function(gameId, playerIndex) {
		Games.update(
			{_id: gameId},
			{$set: {winner: playerIndex}},
			{multi: false}
		);
	}
});