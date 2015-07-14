Meteor.publish("allUserData", function () {
	return Meteor.users.find({});
});

Meteor.publish("challenges", function() {
	return Challenges.find({});
});

Meteor.publish("games", function() {
	return Games.find({});
});