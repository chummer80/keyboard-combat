


//////// STARTUP ////////

Meteor.startup(function() {
	
});





//////// VIEW HELPERS ////////
Template.body.helpers({
	inGame: function() {
		var gamesWithCurrentUser = Games.find({"players.id": Meteor.userId(), status: "playing"});
		return !!gamesWithCurrentUser.count();
	}
});



Template.userList.helpers({
	onlineUsers: function() {
		return Meteor.users.find({"status.online": true});
	}
});


//////// EVENT LISTENERS ////////
