Meteor.methods({
  getChallenge: function () {
    return _.first(Challenges.find({}).fetch());
  }
});