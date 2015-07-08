Meteor.startup(function() {
	Session.set('points', 0);
	Session.set('currentWordIndex', 0);
	Session.set('futureTextIndex', 0);

	// this is the index of the current character within the challenge text.
	Session.set('cursorPosition', 0);	

	// This tracker function will always keep the session variable containing challenge
	// text up to date. That means that it will start blank, then later it will get set
	// to a string of text as soon as the database info arrives. And because session data
	// is reactive in Meteor, the helper functions that use the session data will update
	// automatically.
	Tracker.autorun(function(c) {
		var challenge = _.first(Challenges.find({}).fetch());
		Session.set('challengeText', challenge ? challenge.text : "");

		if (challenge) {
			updateFutureTextIndex();
			c.stop();	// stop the autorun. It was only needed 1 time.
		}
	});
})


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


Template.body.helpers({
	challengeHistory: function() {
		var challengeText = Session.get('challengeText');
		var currentWordIndex = Session.get('currentWordIndex');
		return challengeText ? challengeText.substring(0, currentWordIndex) : "";
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
				return challengeText.substring(currentWordIndex);
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
	}
});

Template.body.events({
	'keypress #typing-textbox': function(event) {
		var cursorPosition = Session.get('cursorPosition');
		var currentWordIndex = Session.get('currentWordIndex');
		var futureTextIndex = Session.get('futureTextIndex');
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
				// To end a word, set cursor and current word index to future-text position. If there is no future text
				// then the challenge is over.
				if (futureTextIndex) {
					Session.set('cursorPosition', futureTextIndex);	
					Session.set('currentWordIndex', futureTextIndex);	
					// Then set a new future text position.
					updateFutureTextIndex();

					// This keypress counts as a correct character. give 1 point.
					Session.set('points', points + 1);
					console.log("points: ", Session.get('points'));

					// Clear the textbox because backing up beyond this word is not allowed.
					event.target.value = "";
				}
				else {
					console.log('challenge over!');
				}
			}
		}
		// else a regular character was typed.
		else {
			// ignore typing if user has typed too many characters for current word.
			if (futureTextIndex === null || (cursorPosition < futureTextIndex)) {
				var charTyped = String.fromCharCode(event.charCode);
				if (charTyped === currentChar()) {
					Session.set('points', points + 1);
				}
				else {
					Session.set('points', points - 1);
				}
				console.log("points: ", Session.get('points'));

				Session.set('cursorPosition', cursorPosition + 1);
				if (Session.get('cursorPosition') >= Session.get('challengeText').length) {
					console.log('challenge over!');
				}
			}
		}
	},
	'keydown #typing-textbox': function(event) {
		// handle backspace key
		if (event.keyCode === 8) {
			var cursorPosition = Session.get('cursorPosition');
			var currentWordIndex = Session.get('currentWordIndex');
			var points = Session.get('points');

			// if cursor is beyond the current word index, then backing up is allowed.
			if (cursorPosition > currentWordIndex) {
				Session.set('cursorPosition', cursorPosition - 1);
				// check if a correct or incorrect character is being deleted 
				// and change the score accordingly.
				var deletedChar = event.target.value[event.target.value.length - 1];
				if (deletedChar === currentChar()) {
					// deleting a correct character reduces the player's score.
					Session.set('points', points - 1);
				}
				else {
					Session.set('points', points + 1);
				}
				console.log("points: ", Session.get('points'));
			}
		}
	}
});