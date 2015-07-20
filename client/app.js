


//////// STARTUP ////////

Accounts.ui.config({
	passwordSignupFields: "USERNAME_AND_OPTIONAL_EMAIL"
});

Meteor.startup(function() {
	
});





//////// VIEW HELPERS ////////

Template.body.helpers({
	isInGame: function() {
		var gamesWithCurrentUser = Games.find({"players.id": Meteor.userId(), status: "playing"});
		return !!gamesWithCurrentUser.count();
	}
});




//////// EVENT LISTENERS ////////

Template.body.events({
	'click #soundToggle': function(event) {
		event.preventDefault();

		var currentSoundSetting = Meteor.users.findOne({_id: Meteor.userId()}, {fields: {sound: 1}}).sound;
		Meteor.call('setSound', Meteor.userId(), !currentSoundSetting);
	}
})