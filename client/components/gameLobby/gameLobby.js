
//////// FUNCTIONS ////////

function findingGame() {
	if (!Meteor.userId()) { return false; }

	var gamesWithCurrentUser = Games.find({"players.id": Meteor.userId(), status: "waiting"});
	return !!gamesWithCurrentUser.count();
}

//////// VIEW HELPERS ////////


Template.gameLobby.helpers({
	findingGame: function() {
		return findingGame();
	},
	wins: function() {
		return Meteor.users.findOne({_id: Meteor.userId()}).wins;
	},
	losses: function() {
		return Meteor.users.findOne({_id: Meteor.userId()}).losses;
	},
	winRate: function() {
		var user = Meteor.users.findOne({_id: Meteor.userId()});
		var totalGames = user.wins + user.losses;

		if (totalGames) {
			var rate = user.wins / totalGames;
			return (rate * 100).toFixed(2) + "%";
		}
		else {
			return "0.00%";
		}
	}
});



//////// EVENT LISTENERS ////////


Template.gameLobby.events({
	'click #find-game-button': function() {
		if (findingGame()) {
			Meteor.call('leaveGame', Meteor.userId(), function(error, result) {
				// Session.set('gameID', null);
				console.log("user left the game");
			});
		}
		else {
			var gameId = Meteor.call('joinGame', function(error, result) {
				console.log("game #" + result + " was joined!");
				// Session.set('gameID', result);
			});
		}
	}
});