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

		// First look for a game that is waiting for another player:
		var waitingGames = Games.find({players: {$size: 1}});
		if (waitingGames.count()) {
			Games.update(
				{players: {$size: 1}},
				{$addToSet: {players: Meteor.userId()}},
				{multi: false},
				function(err) {
					if (err) { 
						console.log("Could not join the game."); 
					}
				}
			);
		}
		// If no game is already waiting, create a new game.
		else {
			Games.insert({players: [Meteor.userId()]}, function(err, id) {
				if (err) {
					console.log("New game could not be created!");
				}
				else {
					console.log(Meteor.userId() + " created a new game: #" + id);
				}
			});
		}
	}
});