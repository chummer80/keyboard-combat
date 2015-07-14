Meteor.methods({
	joinGame: function() {
		if (!Meteor.userId()) {
			throw new Meteor.Error("not-authorized");
		}

		// make sure player isn't already in a game
		var gamesWithCurrentUser = Games.find({players: {$elemMatch: {$in: [Meteor.userId()]}}});
		console.log("num games with current user: " + gamesWithCurrentUser.count());
		if (gamesWithCurrentUser.count()) {
			throw new Meteor.Error("player id #" + Meteor.userId() + " is already in a game");
		}

		// First look for a game that is waiting for another player.
		var waitingGames = Games.find({players: {$size: 1}});
		if (waitingGames.count()) {			
			var gameId = waitingGames.fetch()[0]._id;
			Games.update(
				{_id: gameId},
				{$addToSet: {players: Meteor.userId()}},
				{multi: false}
			);
			return gameId;
		}
		// If no game is already waiting, create a new game.
		else {
			return Games.insert({players: [Meteor.userId()]});
		}
	},

	leaveGame: function(userId) {
		var gamesWithCurrentUser = Games.find({players: {$elemMatch: {$in: [userId]}}});
		if (gamesWithCurrentUser.count()) {
			Games.update(
				{players: userId},
				{$pull: {players: userId}},
				{multi: false}
			);			
		}
	}
});