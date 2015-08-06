


//////// STARTUP ////////

Accounts.ui.config({
	passwordSignupFields: "USERNAME_AND_OPTIONAL_EMAIL"
});

Meteor.startup(function() {
	$(document.body).keydown(function(event) {
		// stop backspace from leaving the page
		if (event.keyCode === 8) {
			event.preventDefault();
		}
	});
});





//////// VIEW HELPERS ////////

Template.body.helpers({
	isInGame: function() {
		var gamesWithCurrentUser = Games.find({"players.id": Meteor.userId(), status: {$in: ["countingDown", "playing", "finished"]}});
		return !!gamesWithCurrentUser.count();
	}
});




//////// EVENT LISTENERS ////////

Template.body.events({
})