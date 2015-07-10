var should = chai.should();

if (!(typeof MochaWeb === 'undefined')){
	MochaWeb.testOnly(function(){
		describe("Server initialization", function(){
			it("should have a Meteor version defined", function(){
				Meteor.release.should.exist;
			});
		});

		describe("Database seeding", function() {
			it("should create challenge database entries with sequential ID numbers", function() {
				var sequential = true;
				var challengeIdObjects = Challenges.find({}, {fields: {_id: 1}}).fetch();
				var challengeIdNums = _.map(challengeIdObjects, function(idObj) {
					return Number(idObj._id);
				});
				challengeIdNums = challengeIdNums.sort(function(a, b) { return a - b; });

				for (var i = 0; i < challengeIdNums.length; i++) {
					challengeIdNums[i].should.equal(i);
					if (challengeIdNums[i] !== i) {
						sequential = false;
						break;
					}
				}
				sequential.should.be.true;
			});
		});
	});
}