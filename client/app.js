


//////// STARTUP ////////

Meteor.startup(function() {
	
});





//////// VIEW HELPERS ////////
Template.body.helpers({
	inGame: function() {
		return false;
	}
});



Template.userList.helpers({
	onlineUsers: function() {
		return Meteor.users.find({"status.online": true});
	}
});


//////// EVENT LISTENERS ////////
