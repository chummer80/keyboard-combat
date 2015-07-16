


//////// STARTUP ////////

Meteor.startup(function() {
	
});





//////// VIEW HELPERS ////////
Template.body.helpers({
	inGame: function() {
		var gamesWithCurrentUser = Games.find({"players.id": Meteor.userId(), status: "playing"});
		return !!gamesWithCurrentUser.count();
	},
	soundSetting: function() {
		var soundSetting = Meteor.users.findOne({_id: Meteor.userId()}).sound;
		return soundSetting;
	}
});



Template.userList.helpers({
	onlineUsers: function() {
		return Meteor.users.find({"status.online": true});
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