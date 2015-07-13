Meteor.publish("allUserData", function () {
	return Meteor.users.find({});
});

Meteor.publish("challenges", function() {
	return Challenges.find({});
});