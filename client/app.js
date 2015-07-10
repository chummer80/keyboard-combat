//////// CONSTANTS ////////

var goalScore = 400;
var correctPoints = 1;
var errorPoints = 3;



//////// STARTUP ////////

Meteor.startup(function() {
	Session.set('points', 0);
	Session.set('correctCount', 0);
	Session.set('errorCount', 0);
	startNewChallenge();
});


//////// FUNCTIONS ////////

function startNewChallenge() {
	Session.set('challengeText', "");
	Session.set('currentWordIndex', 0);
	Session.set('nextWordIndex', 0);
	Session.set('errors', []);

	// this is the index of the current character within the challenge text.
	Session.set('cursorPosition', 0);	

	$('#typing-textbox').val('');

	Meteor.call('velocity/isMirror', function(err, isMirror) {
		if (isMirror) {
			// During testing, set challenge text to a predictable string of text.
			Session.set('challengeText', "Testing testing\n123");
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
	$('#typing-textbox').attr('disabled', true);
	// Session.set('nextWordIndex', Session.get('currentWordIndex'));
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
				text[errorIndex] = '<span class="challenge-error">' + text[errorIndex] + '</span>';
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
			if (nextWordIndex) {
				// return challengeText.substring(currentWordIndex, nextWordIndex);
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
	correctCount: function() {
		return Session.get('correctCount');
	},
	errorCount: function() {
		return Session.get('errorCount') + " : " + Session.get('errors');
	},
	accuracy: function() {
		var correctCount = Session.get('correctCount');
		var errorCount = Session.get('errorCount');
		var accuracy = correctCount / (correctCount + errorCount);

		if (correctCount === 0	&& errorCount === 0) {
			return "0.00%"
		}
		else {
			return (accuracy * 100).toFixed(2) + "%";
		}
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
		var nextWordIndex = Session.get('nextWordIndex');
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
				if (nextWordIndex) {
					Session.set('cursorPosition', nextWordIndex);	
					Session.set('currentWordIndex', nextWordIndex);	
					// Then set a new future text position.
					updateNextWordIndex();

					// This keypress counts as a correct character. give 1 point.
					updateScore(+correctPoints);
					// console.log("points: ", Session.get('points'));

					// Clear the textbox because backing up beyond this word is not allowed.
					event.target.value = "";
				}
				else {
					event.preventDefault();
					startNewChallenge();
				}
			}
		}
		// else a regular character was typed.
		else {
			// ignore typing if user has typed too many characters for current word.
			if (nextWordIndex === null || (cursorPosition < nextWordIndex)) {
				var charTyped = String.fromCharCode(event.charCode);
				if (charTyped === currentChar()) {
					Session.set('correctCount', Session.get('correctCount') + 1);
					updateScore(+correctPoints);
				}
				else {
					// push current cursor position onto the list of errors
					var errorArray = Session.get('errors');
					errorArray.push(cursorPosition);
					Session.set('errors', errorArray);
					Session.set('errorCount', Session.get('errorCount') + 1);
					updateScore(-errorPoints);
				}
			}

			Session.set('cursorPosition', cursorPosition + 1);
			if (Session.get('cursorPosition') >= Session.get('challengeText').length) {
				event.preventDefault();
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
			var nextWordIndex = Session.get('nextWordIndex');
			var points = Session.get('points');

			// if cursor is beyond the current word index, then backing up is allowed.
			if (cursorPosition > currentWordIndex) {
				cursorPosition = cursorPosition - 1
				Session.set('cursorPosition', cursorPosition);
				
				if (nextWordIndex === null || (cursorPosition < nextWordIndex)) {
					// check if a correct or incorrect character is being deleted 
					// and change the score accordingly.
					var deletedChar = event.target.value[event.target.value.length - 1];
					if (deletedChar === currentChar()) {
						// deleting a correct character reduces the player's score.
						Session.set('correctCount', Session.get('correctCount') - 1);
						updateScore(-correctPoints);
					}
					else {
						// Remove current cursor position from the list of errors.
						// It should be the last element in the array.
						var errorArray = Session.get('errors');
						var poppedIndex = errorArray.pop();

						// make sure we're popping the correctd index
						if (poppedIndex !== cursorPosition) {
							throw "Error index " + poppedIndex + " was popped. Should be " + cursorPosition;
						}

						Session.set('errors', errorArray);
						Session.set('errorCount', Session.get('errorCount') - 1);
						updateScore(+errorPoints);
					}
				}
			}
		}
	}
});