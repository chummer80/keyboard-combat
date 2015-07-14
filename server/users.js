Accounts.onCreateUser(function(options, user) {
	if (options.profile) {
		user.profile = options.profile;
	}

	// if user signs up with email, make that his profile name
	if (options.email) {
		user.profile = user.profile || {};
		user.profile.name = options.email;
	}

	return user;
});

UserStatus.events.on("connectionLogout", function(fields) {
	console.log(fields.userId, " logged out. username: " + Meteor.users.findOne({_id: fields.userId}).profile.name);
});