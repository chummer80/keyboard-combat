var goalScore = 400;

//////// STARTUP ////////

Meteor.startup(function() {
	Session.set('points', 0);
	startNewChallenge();
});


//////// FUNCTIONS ////////

function startNewChallenge() {
	Session.set('challengeText', "");
	Session.set('currentWordIndex', 0);
	Session.set('futureTextIndex', 0);

	// this is the index of the current character within the challenge text.
	Session.set('cursorPosition', 0);	

	$('#typing-textbox').val('');

	// This tracker function will start blank, then watch the database until some data
	// is available. At that point it will get set to a string of text from the database. 
	// And after that it will stop tracking. It is only needed once at the beginning.
	Tracker.autorun(function(c) {
		var challenge = getRandomChallenge();
		Session.set('challengeText', challenge ? challenge.text : "");

		if (challenge) {
			updateFutureTextIndex();
			c.stop();	// stop the autorun. It was only needed 1 time.
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

function updateFutureTextIndex() {
	var index = Session.get('futureTextIndex');
	var challengeText = Session.get('challengeText');
	var tempChar = "";

	do {
		index++;
		if (index >= challengeText.length) { 
			// end of string reached
			Session.set('futureTextIndex', null);
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
			Session.set('futureTextIndex', null);
			return; 
		}
		tempChar = challengeText[index];
	}
	while(tempChar === " " || tempChar === "\n");

	// now index points to a non-space character. This is the future text.
	Session.set('futureTextIndex', index);
}

function endGame() {
	$('#typing-textbox').attr('disabled', true);
	// Session.set('futureTextIndex', Session.get('currentWordIndex'));
	console.log('challenge over!');
}

function updateScore(delta) {
	var newScore = Session.get('points') + delta;
	Session.set('points', newScore);

	// check for end of game condition
	if (newScore >= goalScore) {
		endGame();
	}
}


//////// VIEW HELPERS ////////

Template.body.helpers({
	challengeHistory: function() {
		var challengeText = Session.get('challengeText');
		var currentWordIndex = Session.get('currentWordIndex');

		if (challengeText) {
			if (currentWordIndex !== null) {
				return challengeText.substring(0, currentWordIndex);
			}
			else {
				return challengeText;
			}
		}
		else {
			return "";
		}
	},
	challengeCurrent: function() {
		var challengeText = Session.get('challengeText');
		var currentWordIndex = Session.get('currentWordIndex');
		var futureTextIndex = Session.get('futureTextIndex');

		if (challengeText) {
			if (futureTextIndex) {
				return challengeText.substring(currentWordIndex, futureTextIndex);
			}
			else {
				if (currentWordIndex !== null) {
					return challengeText.substring(currentWordIndex);
				}
				else {
					return "";
				}
			}
		}
		else {
			return "";
		}
	},
	challengeFuture: function() {
		var challengeText = Session.get('challengeText');
		var futureTextIndex = Session.get('futureTextIndex');

		if (challengeText && futureTextIndex) {
			return challengeText.substring(futureTextIndex);
		}
		else {
			return "";
		}
	},
	score: function() {
		return Session.get('points');
	},
	futureTextIndex: function() {
		return Session.get('futureTextIndex');
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
	gameOver: function() {
		if (Session.get('challengeText')) {
			return Session.get('points') >= goalScore;
		}
		else {
			return false;
		}
	}
});


//////// EVENT LISTENERS ////////

Template.body.events({
	'keypress #typing-textbox': function(event) {
		var cursorPosition = Session.get('cursorPosition');
		var currentWordIndex = Session.get('currentWordIndex');
		var futureTextIndex = Session.get('futureTextIndex');
		var points = Session.get('points');
		
		// set cursor to the end of the textbox contents before doing anything.
		var textContentsLength = event.target.value.length;
		event.target.setSelectionRange(textContentsLength, textContentsLength);

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
				// To end a word, set cursor and current word index to future-text position. If there is no future text
				// then the challenge is over.
				if (futureTextIndex) {
					Session.set('cursorPosition', futureTextIndex);	
					Session.set('currentWordIndex', futureTextIndex);	
					// Then set a new future text position.
					updateFutureTextIndex();

					// This keypress counts as a correct character. give 1 point.
					updateScore(+1);
					// console.log("points: ", Session.get('points'));

					// Clear the textbox because backing up beyond this word is not allowed.
					event.target.value = "";
				}
				else {
					// endGame();
					startNewChallenge();
				}
			}
		}
		// else a regular character was typed.
		else {
			// ignore typing if user has typed too many characters for current word.
			if (futureTextIndex === null || (cursorPosition < futureTextIndex)) {
				var charTyped = String.fromCharCode(event.charCode);
				if (charTyped === currentChar()) {
					updateScore(+1);
				}
				else {
					updateScore(-1);
				}
			}

			Session.set('cursorPosition', cursorPosition + 1);
			if (Session.get('cursorPosition') >= Session.get('challengeText').length) {
				// endGame();
				startNewChallenge();
			}
		}
	},
	'keydown #typing-textbox': function(event) {
		// set cursor to the end of the textbox contents before doing anything.
		var textContentsLength = event.target.value.length;
		event.target.setSelectionRange(textContentsLength, textContentsLength);

		// handle backspace key
		if (event.keyCode === 8) {
			var cursorPosition = Session.get('cursorPosition');
			var currentWordIndex = Session.get('currentWordIndex');
			var futureTextIndex = Session.get('futureTextIndex');
			var points = Session.get('points');

			// if cursor is beyond the current word index, then backing up is allowed.
			if (cursorPosition > currentWordIndex) {
				cursorPosition = cursorPosition - 1
				Session.set('cursorPosition', cursorPosition);
				
				if (futureTextIndex === null || (cursorPosition < futureTextIndex)) {
					// check if a correct or incorrect character is being deleted 
					// and change the score accordingly.
					var deletedChar = event.target.value[event.target.value.length - 1];
					if (deletedChar === currentChar()) {
						// deleting a correct character reduces the player's score.
						updateScore(-1);
					}
					else {
						updateScore(+1);
					}
				}
			}
		}
	}
});