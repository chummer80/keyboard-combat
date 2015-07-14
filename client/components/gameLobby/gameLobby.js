
//////// FUNCTIONS ////////

function findingGame() {
	if (!Meteor.userId()) { return false; }

	var gamesWithCurrentUser = Games.find({players: {$elemMatch: {$in: [Meteor.userId()]}}});
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
		Meteor.call('joinGame');
	}
});