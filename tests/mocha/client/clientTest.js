var should = chai.should();

if (!(typeof MochaWeb === 'undefined')){
	MochaWeb.testOnly(function(){
		// Let the reactive elements on the page get set before testing.
		before(function() {
			setTimeout(function(){}, 50);
		});

		describe("Challenge Start", function() {
			it("should have a blank history portion", function() {
				$('#challenge-history').html().should.be.empty;
			});
			it("should highlight the first word", function() {
				$('#challenge-current').html().should.equal("Testing ");
			});
			it("should have a future text portion consisting of everything after the first word", function() {
				$('#challenge-future').html().should.equal("testing\n123");
			});
		});

		// Challenge text in testing environment will be "Testing testing\n123"
		describe("Typing the challenge", function(){
			context("correct character was typed", function() {
				it("should register a correct character as +1 point", function(){
					$('#score').html().should.equal("Score: 0 / 400");
					var e = $.Event("keypress", {charCode: "T".charCodeAt(0)});

					$('#typing-textbox').trigger(e);

					setTimeout(
						function() {
							$('#score').html().should.equal("Score: 1 / 400");
						},
						50	// wait 50 milliseconds before testing that the score updated.
					);
				});
				it("should put the typed character in the history span", function() {
					setTimeout(
						function() {
							$('#challenge-history').html().should.equal("T");
						},
						50	// wait 50 milliseconds before testing that the score updated.
					);
				});
			})
		});
	});
}
