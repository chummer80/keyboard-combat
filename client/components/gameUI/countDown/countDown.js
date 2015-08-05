var timerStates = ["3", "2", "1", "GO!"];
var stateIndex, gameId;
var $timerUI, countdownTimer;

function stepTimer() {
	stateIndex = ++stateIndex || 0;

	if (timerStates[stateIndex]) {
		$timerUI.text(timerStates[stateIndex]);
	}
	else {
		// setting status to playing will replace timer with game UI.
		Meteor.call('setGameStatus', gameId, "playing");
	}
}

Template.countDown.rendered = function() {
	var game = Games.findOne({"players.id": Meteor.userId()});
	gameId = game._id;

	$timerUI = $('#countdown-timer');

	// reset the countdown or the state will persist between games
	stateIndex = -1;
	countdownTimer = Meteor.setInterval(stepTimer, 1000);
};

Template.countDown.destroyed = function() {
	Meteor.clearInterval(countdownTimer);
};