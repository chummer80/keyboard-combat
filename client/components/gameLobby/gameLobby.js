
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