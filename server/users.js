Accounts.onCreateUser(function(options, user) {
	if (options.profile) {
		user.profile = options.profile;
	}

	// if user signs up with email, make that his profile name
	if (options.email) {
		user.profile = user.profile || {};
		user.profile.name = options.email;
	}

	user.wins = 0;
	user.losses = 0;
	user.sound = true;

	return user;
});

UserStatus.events.on("connectionLogout", function(fields) {
	// if a game is in "playing" state and a player leaves, the other player auto-wins
	var game = Games.findOne({"players.id": fields.userId, status: "playing"});
	if (game && game.players.length > 1) {
		var gameId = game._id;
		var selfIndex = (game.players[0].id === fields.userId) ? 0 : 1;
		var opponentIndex = (game.players[0].id === fields.userId) ? 1 : 0;

		Meteor.call('setWinner', gameId, opponentIndex);
	}

	Meteor.call('leaveGame', fields.userId);
	console.log(fields.userId, " logged out. username: " + Meteor.users.findOne({_id: fields.userId}).profile.name);
});