/*
// wait 50 milliseconds for handlebars templates to update the page before executing any assertions
var updateDelay = 100;	
var should = chai.should();

// test helper function that waits for reactive page 
// elements to update before assertions are attempted.
function waitPageUpdate(callback) {
	setTimeout(callback, updateDelay);
}


if (!(typeof MochaWeb === 'undefined')){
	MochaWeb.testOnly(function(){
		// Let the reactive elements on the page get set before testing.
		before(function(done) {
			waitPageUpdate(function(){ done(); });
		});

		describe("Challenge Start", function() {
			it("should have a blank history portion", function() {
				$('#challenge-history').text().should.be.empty;
			});
			it("should highlight the first word", function() {
				$('#challenge-current').text().should.equal("Testing ");
			});
			it("should have a future text portion consisting of everything after the first word", function() {
				$('#challenge-future').text().should.equal("testing\n123 testing");
			});
		});

		// Challenge text in testing environment will be "Testing testing\n123 testing"
		describe("Typing the challenge", function(){
			context("correct character was typed", function() {
				before(function(done) {
					$('#score').text().should.equal("Score: 0 / 400");
					
					var e = $.Event("keypress", {charCode: "T".charCodeAt(0)});
					$('#typing-textbox').trigger(e);

					waitPageUpdate(function(){ done(); });
				});

				it("should register a correct character as +1 point", function(){
					$('#score').text().should.equal("Score: 1 / 400");
				});
				it("should put the typed character in the history span", function() {
					$('#challenge-history').text().should.equal("T");
				});
				it("should remove the character from the current word span", function() {
					$('#challenge-current').text().should.equal("esting ");
				});
			});

			context("incorrect character was typed", function() {
				before(function(done) {
					$('#score').text().should.equal("Score: 1 / 400");
					
					var e = $.Event("keypress", {charCode: "X".charCodeAt(0)});
					$('#typing-textbox').trigger(e);

					waitPageUpdate(function(){ done(); });
				});

				it("should register an incorrect character as -3 points", function() {
					$('#score').text().should.equal("Score: -2 / 400");
				});
				it("should place the correct character in the history span", function() {
					$('#challenge-history').text().should.equal("Te");
				});
				it("should mark the character that was not typed properly in an error span", function() {
					$('#challenge-history .challenge-error').last().text().should.equal("e");
				});
				it("should calculate and display the total accuracy rate", function() {
					$('#accuracy').text().should.equal("Accuracy: 50.00%");
				});
			});

			context("user completes the current word", function() {
				before(function(done) {
					var input = "sting ";
					for (var i = 0; i < input.length; i++) {
						var e = $.Event("keypress", {charCode: input.charCodeAt(i)});
						$('#typing-textbox').trigger(e);
					}
					waitPageUpdate(function(){ done(); });
				});

				it("should put entire next word in the current word span", function() {
					$('#challenge-current').text().should.equal("testing\n");
				});
				it("should put entire next word in the current word span", function() {
					$('#challenge-current').text().should.equal("testing\n");
				});
			});

			context("user types white space characters before starting the current word", function() {
				context("blank space character", function() {
					before(function(done) {
						$('#score').text().should.equal("Score: 4 / 400");

						var e = $.Event("keypress", {charCode: " ".charCodeAt(0)});
						$('#typing-textbox').trigger(e);
						waitPageUpdate(function(){ done(); });
					});

					it("should not change the score", function() {
						$('#score').text().should.equal("Score: 4 / 400");
					});
					it("should not put the current character in the history span", function() {
						$('#challenge-history').text().should.equal("Testing ");
					});
					it("should not remove the current character from the current word span", function() {
						$('#challenge-current').text().should.equal("testing\n");
					});
				});
				context("new line character", function() {
					before(function(done) {
						$('#score').text().should.equal("Score: 4 / 400");

						var e = $.Event("keypress", {charCode: 13});
						$('#typing-textbox').trigger(e);
						waitPageUpdate(function(){ done(); });
					});

					it("should not change the score", function() {
						$('#score').text().should.equal("Score: 4 / 400");
					});
					it("should not put the current character in the history span", function() {
						$('#challenge-history').text().should.equal("Testing ");
					});
					it("should not remove the current character from the current word span", function() {
						$('#challenge-current').text().should.equal("testing\n");
					});
				});
			});

			context("backspace key is pressed", function() {
				context("at the beginning of a word", function() {
					before(function(done) {
						$('#score').text().should.equal("Score: 4 / 400");

						var e = $.Event("keydown", {keyCode: 8});
						$('#typing-textbox').trigger(e);
						waitPageUpdate(function(){ done(); });
					});

					it("should not change the score", function() {
						$('#score').text().should.equal("Score: 4 / 400");
					});
					it("should not put the current character in the history span", function() {
						$('#challenge-history').text().should.equal("Testing ");
					});
					it("should not remove the current character from the current word span", function() {
						$('#challenge-current').text().should.equal("testing\n");
					});
				});
				context("in the middle of word, after a correct character was typed", function() {
					before(function(done) {
						var e = $.Event("keypress", {charCode: "t".charCodeAt(0)});
						$('#typing-textbox').trigger(e).val("t");

						waitPageUpdate(function() {
							$('#score').text().should.equal("Score: 5 / 400");
							$('#challenge-history').text().should.equal("Testing t");
							$('#challenge-current').text().should.equal("esting\n");
							// there should be 8 correct characters and 1 wrong character typed so far
							$('#accuracy').text().should.equal("Accuracy: 88.89%");

							var e = $.Event("keydown", {keyCode: 8});
							$('#typing-textbox').trigger(e).val("");
							
							waitPageUpdate(function(){ done(); });
						});
					});

					it("should subtract a point from the score", function() {
						$('#score').text().should.equal("Score: 4 / 400");
					});
					it("should remove the character from the history area", function() {
						$('#challenge-history').text().should.equal("Testing ");
					});
					it("should add the character back into the current word area", function() {
						$('#challenge-current').text().should.equal("testing\n");
					});
					it("should update the accuracy according to the new stats", function() {
						// there should be 7 correct characters and 1 wrong character typed so far
						$('#accuracy').text().should.equal("Accuracy: 87.50%");
					});
				});
				context("in the middle of word, after a wrong character was typed", function() {
					before(function(done) {
						var e = $.Event("keypress", {charCode: "X".charCodeAt(0)});
						$('#typing-textbox').trigger(e).val("X");

						waitPageUpdate(function() {
							$('#score').text().should.equal("Score: 1 / 400");
							// there should be 7 correct characters and 2 wrong characters typed so far
							$('#accuracy').text().should.equal("Accuracy: 77.78%");

							var e = $.Event("keydown", {keyCode: 8});
							$('#typing-textbox').trigger(e).val("");
							
							waitPageUpdate(function(){ done(); });
						});
					});

					it("should add 3 points to the score", function() {
						$('#score').text().should.equal("Score: 4 / 400");
					});
					it("should update the accuracy according to the new stats", function() {
						// there should be 7 correct characters and 1 wrong character typed so far
						$('#accuracy').text().should.equal("Accuracy: 87.50%");
					});
				});
			});
			
			context("typing continues past the length of the current word", function() {
				before(function(done) {
					// current word is "testing\n" which is 8 characters. To go past the length, 9 chars are needed.
					var input = "testingX";
					for (var i = 0; i < input.length; i++) {
						var e = $.Event("keypress", {charCode: input.charCodeAt(i)});
						$('#typing-textbox').trigger(e);
					}
					waitPageUpdate(function() {
						$('#score').text().should.equal("Score: 8 / 400");
						// there should be 14 correct characters and 2 wrong characters typed so far
						$('#accuracy').text().should.equal("Accuracy: 87.50%");	
						
						// Enter another character past the length of the word
						var e = $.Event("keypress", {charCode: "5".charCodeAt(0)});
						$('#typing-textbox').trigger(e);
						waitPageUpdate(function(){ done(); });
					});
				});

				it("should have no effect on the score", function() {
					// there should be 14 correct characters and 2 wrong characters typed so far
					$('#score').text().should.equal("Score: 8 / 400");
					$('#accuracy').text().should.equal("Accuracy: 87.50%");	
				});

				after(function() {
					// go to next word by entering a blank space character.
					// This will count as a correct character.
					var e = $.Event("keypress", {charCode: " ".charCodeAt(0)});
					$('#typing-textbox').trigger(e);
				});
			});

			context("word is ended early", function() {
				context("current word is not the final word", function() {
					before(function(done) {
						// enter a non-whitespace character to begin the word. 
						// Current word is "123 ". We will use the correct character.
						var e = $.Event("keypress", {charCode: "1".charCodeAt(0)});
						$('#typing-textbox').trigger(e);

						waitPageUpdate(function(){
							// there should be 16 correct characters and 2 wrong characters typed so far
							$('#score').text().should.equal("Score: 10 / 400");
							$('#accuracy').text().should.equal("Accuracy: 88.89%");

							// entering a blank space or new line ends the word that is currently in progress.
							e = $.Event("keypress", {charCode: " ".charCodeAt(0)});
							$('#typing-textbox').trigger(e);

							waitPageUpdate(function(){ done(); });
						});
					});

					it("should add 1 point to the score for correctly typing the space", function() {
						$('#score').text().should.equal("Score: 11 / 400");
					});
					it("should count the space as 1 correct character and should not penalize for skipped characters", function() {
						// there should be 17 correct characters and 2 wrong characters typed so far
						$('#accuracy').text().should.equal("Accuracy: 89.47%");						
					});
					it("should add the entire word to the history span", function() {
						$('#challenge-history').text().should.equal("Testing testing\n123 ");
					});
					it("should put the next word in the current word span", function() {
						$('#challenge-current').text().should.equal("testing");
					});
				});
				context("current word is final word", function() {
					before(function(done) {
						// enter a non-whitespace character to begin the word. 
						// Current word is "testing". We will use the correct character.
						var e = $.Event("keypress", {charCode: "t".charCodeAt(0)});
						$('#typing-textbox').trigger(e);

						waitPageUpdate(function(){
							// there should be 18 correct characters and 2 wrong characters typed so far
							$('#score').text().should.equal("Score: 12 / 400");
							$('#accuracy').text().should.equal("Accuracy: 90.00%");

							// entering a blank space or new line ends the word that is currently in progress.
							e = $.Event("keypress", {charCode: " ".charCodeAt(0)});
							$('#typing-textbox').trigger(e);

							waitPageUpdate(function(){ done(); });
						});
					});

					it("should have no effect on the score", function() {
						// there should still be 18 correct characters and 2 
						// wrong characters typed so far
						$('#score').text().should.equal("Score: 12 / 400");
						$('#accuracy').text().should.equal("Accuracy: 90.00%");
					});
				});
			});

			// challenge was completed in previous test
			context("challenge is completed", function() {
				context("by ending the final word early", function() {
					it("should reload the challenge with a new challenge", function() {
						it("should have a blank history portion", function() {
							$('#challenge-history').text().should.be.empty;
						});
						it("should highlight the first word", function() {
							$('#challenge-current').text().should.equal("Testing ");
						});
						it("should have a future text portion consisting of everything after the first word", function() {
							$('#challenge-future').text().should.equal("testing\n123 testing");
						});
					});
				});
				context("by typing the full final word", function() {
					before(function(done) {
						// Type almost all the way to the end of the second challenge.
						var input = "Testing testing 123 testin";
						for (var i = 0; i < input.length; i++) {
							var e = $.Event("keypress", {charCode: input.charCodeAt(i)});
							$('#typing-textbox').trigger(e);
						}
						waitPageUpdate(function() {
							$('#challenge-history').text().should.equal("Testing testing\n123 testin");
							$('#challenge-current').text().should.equal("g");
							$('#challenge-future').text().should.be.empty;
							
							var e = $.Event("keypress", {charCode: "g".charCodeAt(0)});
							$('#typing-textbox').trigger(e);
							waitPageUpdate(function(){ done(); });
						});
					});

					it("should reload the challenge with a new challenge", function() {
						it("should have a blank history portion", function() {
							$('#challenge-history').text().should.be.empty;
						});
						it("should highlight the first word", function() {
							$('#challenge-current').text().should.equal("Testing ");
						});
						it("should have a future text portion consisting of everything after the first word", function() {
							$('#challenge-future').text().should.equal("testing\n123 testing");
						});
					});
				});
			});

			// score should be 39 at this point. Goal score is set to 40 in testing.
			context("goal score is achieved", function() {
				before(function(done) {
					$('#game-over-msg').length.should.equal(0);
					should.not.exist($('#typing-textbox').attr('disabled'));

					var e = $.Event("keypress", {charCode: "T".charCodeAt(0)});
					$('#typing-textbox').trigger(e);
					waitPageUpdate(function(){ done(); });
				});

				it("should show a game over message", function() {
					$('#game-over-msg').length.should.be.above(0);
				});
				it("should disable all further typing", function() {
					$('#typing-textbox').attr('disabled').should.be.ok;
				});
			});
		});
	});
}
*/