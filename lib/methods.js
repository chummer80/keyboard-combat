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
					score: 0,
					timer: 0
				}],
				status: "waiting",
				winner: null
			});
		}
	},
	leaveGame: function(userId) {
		var gameWithCurrentUser = Games.findOne({"players.id": userId});
		if (gameWithCurrentUser) {
			// if this user is the only player in the game, delete the game document.
			if (gameWithCurrentUser.players.length === 1) {
				Games.remove({_id: gameWithCurrentUser._id});
			}
			// otherwise just remove the player from the game document
			else {
				Games.update(
					{_id: gameWithCurrentUser._id},
					{$pull: {players: {id: userId}}},
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

		var players = Games.findOne({_id: gameId}).players;
		Meteor.call('addWin', players[playerIndex].id);

		var otherPlayerIndex = 1 - playerIndex;
		Meteor.call('addLoss', players[otherPlayerIndex].id);
	},
	addWin: function(playerId) {
		Meteor.users.update({_id: playerId}, {$inc: {wins: 1}});
	},
	addLoss: function(playerId) {
		Meteor.users.update({_id: playerId}, {$inc: {losses: 1}});
	},
	setSound: function(userId, setting) {
		Meteor.users.update(
			{_id: userId}, 
			{$set: {sound: setting}}
		);
	}
});