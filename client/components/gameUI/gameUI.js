//////// CONSTANTS ////////

var goalScore = 300;
Meteor.call('velocity/isMirror', function(err, isMirror) {
	if (isMirror) {
		goalScore = 40;
	}
});

var correctPoints = 1;
var errorPoints = 3;

var miscAnims = [
	'anim-default',
	'anim-win',
	'anim-lose'
];

// attack animations names and how long they should play
var attackAnimTimes = {
	'anim-punch': 300,
	'anim-power-punch': 500,
	'anim-kick': 300,
	'anim-power-kick': 500
};

var attackAnims = _.keys(attackAnimTimes);

var allAnims = _.union(miscAnims, attackAnims);

//////// GAME STATE VARS ////////

var gameId, selfIndex, opponentIndex, opponentName = "", lastOppAnim = "";
var gameInProgress, finalOpponentScore;
var timer, timerStart, animTimer;


//////// FUNCTIONS ////////

function startNewChallenge() {
	Session.set('timer', 0);
	Session.set('challengeText', "");
	Session.set('currentWordIndex', 0);
	Session.set('nextWordIndex', 0);
	Session.set('errors', []);

	// this is the index of the current character within the challenge text.
	Session.set('cursorPosition', 0);

	Meteor.call('velocity/isMirror', function(err, isMirror) {
		if (isMirror) {
			// During testing, set challenge text to a predictable string of text.
			Session.set('challengeText', "Testing testing\n123 testing");
			updateNextWordIndex();
		}
		else {
			// This tracker function will start blank, then watch the database until some data
			// is available. At that point it will get set to a string of text from the database. 
			// And after that it will stop tracking. It is only needed once at the beginning.
			Tracker.autorun(function(c) {
				var challenge = getRandomChallenge();

				if (challenge) {
					Session.set('challengeText', challenge.text);
					updateNextWordIndex();
					c.stop();	// stop the autorun. It was only needed 1 time.
				}
			});
		}
	});
}

function getRandomChallenge() {
	var randChallengeIndex = _.random(Challenges.find().count() - 1);
	return Challenges.findOne({_id: randChallengeIndex.toString()});
}

function currentChar() {
	return Session.get('challengeText')[Session.get('cursorPosition')];
}

function updateNextWordIndex() {
	var index = Session.get('nextWordIndex');
	var challengeText = Session.get('challengeText');
	var tempChar = "";

	do {
		index++;
		if (index >= challengeText.length) { 
			// end of string reached
			Session.set('nextWordIndex', null);
			return; 
		} 
		tempChar = challengeText[index];
	} 
	while(tempChar !== " " && tempChar !== "\n");

	// index points to a blank space now. Now search for the next non-whitespace character.
	do {
		index++;
		if (index >= challengeText.length) { 
			// end of string reached
			Session.set('nextWordIndex', null);
			return; 
		}
		tempChar = challengeText[index];
	}
	while(tempChar === " " || tempChar === "\n");

	// now index points to a non-space character. This is the future text.
	Session.set('nextWordIndex', index);
}

function endGame() {
	Meteor.call('setGameStatus', gameId, "finished");

	var game = Games.findOne({_id: gameId}, {fields: {winner: 1, "players.score": 1}});
	gameInProgress = false;
	finalOpponentScore = game.players[opponentIndex].score;
	clearInterval(timer);

	// stop handling typing events
	$(document).off('keypress');
	$(document).off('keydown');
}

function updateScore(delta) {
	// don't let scores go negative
	var newScore = Math.max(Session.get('points') + delta, 0);
	Session.set('points', newScore);
	Meteor.call('setScore', gameId, selfIndex, newScore);

	// check for winning end of game condition
	if (newScore >= goalScore) {
		Meteor.call('setWinner', gameId, selfIndex);

		//make character go into win animation
		playCharAnim('anim-win', true);

		playSound("win");

		endGame();
	}
}

function playCharAnim(anim, isSelfAnim) {

	// If this is a self-animation, emit the animation to the opponent's client 
	// by putting the animation name into the Game document
	if (isSelfAnim) {
		Meteor.call('setCharAnim', gameId, selfIndex, anim);
		Meteor.clearTimeout(animTimer);
	}
	
	// get a list of animations classes to remove
	var otherAnims = _.without(allAnims, anim);
	var otherAnimsString = otherAnims.join(' ');
	var $char = isSelfAnim ? $('#left-char') : $('#right-char');
	$char.removeClass(otherAnimsString).addClass(anim);
}

function playSelfAttackAnim() {
	// pick a random attack animation and play it.
	var attackAnim = attackAnims[_.random(attackAnims.length - 1)];

	playCharAnim(attackAnim, true);

	animTimer = Meteor.setTimeout(function() {
		playCharAnim('anim-default', true);
	}, attackAnimTimes[attackAnim]);
}

function playSound(sound) {
	var soundSetting = Meteor.users.findOne({_id: Meteor.userId()}, {fields: {sound: 1}}).sound;
	if (soundSetting) {
		switch(sound) {
			case "fight":
				playFightSound();
				break;
			case "win":
				$('audio#win')[0].play();
				break;
			case "lose":
				$('audio#lose')[0].play();
				break;
		}
	}
}

function playFightSound() {
	var $fightSounds = $('audio.fight-sound');

	// play a random sound
	var index = _.random($fightSounds.length - 1);

	$fightSounds[index].play();
}

function handleKeypress(event) {
	var cursorPosition = Session.get('cursorPosition');
	var currentWordIndex = Session.get('currentWordIndex');
	var nextWordIndex = Session.get('nextWordIndex');
	var points = Session.get('points');
	
	// blank space or enter key was pressed.
	if (event.charCode == 13 || event.charCode == 32) {
		// Stop default behavior of space bar being pressed. This is to allow 
		// the textbox to contain just the current word being typed. No useless
		// blank spaces.
		event.preventDefault();

		// If cursor was in the middle of a word when space or enter was pressed,
		// then the user is ending their current word. Otherwise ignore this keystroke.
		// It was probably an accident. 
		if (cursorPosition != currentWordIndex) {

			// determine whether the word that just ended had an error in it or not.
			// if word was ended early, it had an error.
			var hasError = (currentChar() !== " ") && (currentChar() !== "\n");

			// check if an incorrect char was typed between currentWordIndex and cursorPosition.
			if (!hasError) {
				var errors = Session.get('errors');
				for (var i = 0; i < errors.length; i++) {
					if (errors[i] >= currentWordIndex && errors[i] <= cursorPosition) {
						hasError = true;
						break;
					}
				}
			}

			if (hasError) {
				Session.set('errorWordCount', Session.get('errorWordCount') + 1);
			}

			// To end a word, set cursor and current word index to future-text position. If there is no future text
			// then the challenge is over.
			if (nextWordIndex) {
				// This keypress counts as a correct character. give 1 point.
				Session.set('correctCharCount', Session.get('correctCharCount') + 1);
				updateScore(+correctPoints);

				Session.set('cursorPosition', nextWordIndex);	
				Session.set('currentWordIndex', nextWordIndex);	
				// Then set a new future text position.
				updateNextWordIndex();
			}
			else {
				event.preventDefault();
				startNewChallenge();
			}

			playSound("fight");

			// make character go into attack animation briefly
			playSelfAttackAnim();
		}
	}
	// else a regular character was typed.
	else {
		// ignore typing if user has typed too many characters for current word.
		if (nextWordIndex === null || (cursorPosition < nextWordIndex)) {
			var charTyped = String.fromCharCode(event.charCode);
			if (charTyped === currentChar()) {
				Session.set('correctCharCount', Session.get('correctCharCount') + 1);
				updateScore(+correctPoints);
			}
			else {
				// push current cursor position onto the list of errors
				var errorArray = Session.get('errors');
				errorArray.push(cursorPosition);
				Session.set('errors', errorArray);
				Session.set('errorCharCount', Session.get('errorCharCount') + 1);
				updateScore(-errorPoints);
			}
			Session.set('cursorPosition', cursorPosition + 1);
		}

		if (Session.get('cursorPosition') >= Session.get('challengeText').length) {
			event.preventDefault();
			startNewChallenge();
		}
	}
}

function handleKeydown(event) {
	// handle backspace key
	if (event.keyCode === 8) {
		event.preventDefault();

		var cursorPosition = Session.get('cursorPosition');
		var currentWordIndex = Session.get('currentWordIndex');
		var nextWordIndex = Session.get('nextWordIndex');
		var points = Session.get('points');

		// if cursor is beyond the current word index, then backing up is allowed.
		if (cursorPosition > currentWordIndex) {
			cursorPosition = cursorPosition - 1;	// set new cursor position
			Session.set('cursorPosition', cursorPosition);
			
			if (nextWordIndex === null || (cursorPosition < nextWordIndex)) {
				// check if a correct or incorrect character is being deleted 
				// and change the score accordingly.
				var errorArray = Session.get('errors');
				if (_.contains(errorArray, cursorPosition)) {
					// Remove current cursor position from the list of errors.
					// It should be the last element in the array.
					
					var poppedIndex = errorArray.pop();

					// make sure we're popping the correctd index
					if (poppedIndex !== cursorPosition) {
						throw "Error index " + poppedIndex + " was popped. Should be " + cursorPosition;
					}

					Session.set('errors', errorArray);
					Session.set('errorCharCount', Session.get('errorCharCount') - 1);
					updateScore(+errorPoints);
				}
				else {
					// deleting a correct character reduces the player's score.
					Session.set('correctCharCount', Session.get('correctCharCount') - 1);
					updateScore(-correctPoints);
				}
			}
		}
	}
}



//////// STARTUP ////////

Template.gameUI.created = function() {
	var game = Games.findOne({"players.id": Meteor.userId()});
	gameId = game._id;
	selfIndex = (game.players[0].id === Meteor.userId()) ? 0 : 1;
	opponentIndex = (game.players[0].id === Meteor.userId()) ? 1 : 0;
	opponentName = game.players[opponentIndex].name;

	// start timer
	timerStart = Date.now();
	timer = Meteor.setInterval(function() {
		Session.set('timer', Date.now() - timerStart);
	}, 100);

	// watch this game's winner index for changes so we
	// know when to call endGame()
	Games.find({_id: gameId}, {fields: {winner: 1}})
		.observeChanges({
			changed: function(id, fields) {

				// check if this player lost
				if (fields.winner === opponentIndex) {
					playCharAnim('anim-lose', true);

					playSound("lose");

				}
				endGame();
			}
		});

	// watch the opponent's animation flag in the game data in order to know
	// which animation to play for the opponent's character.
	Games.find({_id: gameId}, {fields: {"players.anim": 1}})
		.observeChanges({
			changed: function(id, fields) {
				if (lastOppAnim !== fields.players[opponentIndex].anim) {
					lastOppAnim = fields.players[opponentIndex].anim;
					playCharAnim(lastOppAnim, false);
				}
			}
		});


	gameInProgress = true;
	finalOpponentScore = 0;
	Session.set('points', 0);
	Session.set('correctCharCount', 0);
	Session.set('errorCharCount', 0);
	Session.set('errorWordCount', 0);
	startNewChallenge();

	// set up typing event handlers
	$(document).keypress(function(event) {
		handleKeypress(event);
	});
	$(document).keydown(function(event) {
		handleKeydown(event);
	});

	// start initial character animations
	playCharAnim('anim-default', true);
	playCharAnim('anim-default', false);
}


//////// VIEW HELPERS ////////

Template.gameUI.helpers({
	challengeHistory: function() {
		var challengeText = Session.get('challengeText');
		var currentWordIndex = Session.get('currentWordIndex');
		var nextWordIndex = Session.get('nextWordIndex');
		var cursorPosition = Session.get('cursorPosition');
		var text;

		if (challengeText) {
			if (nextWordIndex) {
				text = challengeText.substring(0, Math.min(cursorPosition, nextWordIndex));
			}
			else {
				text = challengeText.substring(0, cursorPosition);
			}

			// Mark errors within this text with spans of class 'challenge-error'
			text = text.split("");
			_.each(Session.get('errors'), function(errorIndex) {
				// use an underscore instead of blank space to be able to highlight it in red.
				var errorChar = (text[errorIndex] === " ") ? " \u0332" : text[errorIndex];
				text[errorIndex] = '<span class="challenge-error">' + errorChar + '</span>';
			});
			text = text.join("");
		}
		else {
			text = "";
		}
	
		return text;
	},
	challengeCurrent: function() {
		var challengeText = Session.get('challengeText');
		var currentWordIndex = Session.get('currentWordIndex');
		var nextWordIndex = Session.get('nextWordIndex');
		var cursorPosition = Session.get('cursorPosition');

		if (challengeText) {
			if (currentChar() === " ") {
				return " \u0332";
			}
			else if (nextWordIndex) {
				return challengeText.substring(Math.min(cursorPosition, nextWordIndex), nextWordIndex);
			}
			else {
				return challengeText.substring(cursorPosition);
			}
		}
		else {
			return "";
		}
	},
	challengeFuture: function() {
		var challengeText = Session.get('challengeText');
		var nextWordIndex = Session.get('nextWordIndex');

		if (challengeText && nextWordIndex) {
			return challengeText.substring(nextWordIndex);
		}
		else {
			return "";
		}
	},
	score: function() {
		return Session.get('points');
	},
	nextWordIndex: function() {
		return Session.get('nextWordIndex');
	},
	currentWordIndex: function() {
		return Session.get('currentWordIndex');
	},
	cursorPosition: function() {
		return Session.get('cursorPosition');
	},
	goalScore: function() {
		return goalScore;
	},
	correctCharCount: function() {
		return Session.get('correctCharCount');
	},
	errorCharCount: function() {
		return Session.get('errorCharCount') + " : " + Session.get('errors');
	},
	totalCharCount: function() {
		return Session.get('errorCharCount') + Session.get('correctCharCount');
	},
	errorWordCount: function() {
		return Session.get('errorWordCount');
	},
	accuracy: function() {
		var correctCharCount = Session.get('correctCharCount');
		var errorCharCount = Session.get('errorCharCount');
		var accuracy = correctCharCount / (correctCharCount + errorCharCount);

		if (correctCharCount === 0	&& errorCharCount === 0) {
			return "0.00%";
		}
		else {
			return (accuracy * 100).toFixed(2) + "%";
		}
	},
	timer: function() {
		var timerMs = Session.get('timer');
		
		var min = Math.floor(timerMs / 1000 / 60);
		var minStr = min < 10 ? "0" + min : min.toString();

		var sec = Math.floor((timerMs - min * 1000 * 60)/ 1000);
		var secStr = sec < 10 ? "0" + sec : sec.toString();
		
		return minStr + ":" + secStr;
	},
	wpm: function() {
		var totalChars = Session.get('correctCharCount') + Session.get('errorCharCount');
		var minutes = Session.get('timer') / 1000 / 60;
		var netWpm = (totalChars / 5 - Session.get('errorWordCount')) / minutes;
		return Math.round(netWpm);
	},
	isWinner: function() {
		var game = Games.findOne({_id: gameId}, {fields: {winner: 1}});
		return game.winner === selfIndex;
	},
	isLoser: function() {
		var game = Games.findOne({_id: gameId}, {fields: {winner: 1}});
		return game.winner === opponentIndex;
	},
	isGameOver: function() {
		var game = Games.findOne({_id: gameId}, {fields: {winner: 1}});
	 	return game.winner !== null;
	},
	opponentName: function() {
		return opponentName;
	},
	opponentScore: function() {
		if (gameInProgress) {
			var game = Games.findOne({_id: gameId}, {fields: {"players.score": 1}});
			return game.players[opponentIndex].score;
		}
		else {
			return finalOpponentScore;
		}
	},
	selfHealthPct: function() {
		var opponentScore;
		if (gameInProgress) {
			var game = Games.findOne({_id: gameId}, {fields: {"players.score": 1}});
			opponentScore = game.players[opponentIndex].score;
		}
		else {
			opponentScore = finalOpponentScore;
		}
		return ((goalScore - opponentScore) / goalScore * 100) + "%";
	},
	opponentHealthPct: function() {
		return ((goalScore - Session.get('points')) / goalScore * 100) + "%";
	}
});


//////// EVENT LISTENERS ////////

Template.gameUI.events({
	'click #leave-game-button': function() {
		console.log("leaving game");
		Meteor.call('leaveGame', Meteor.userId());
	}
});

