// This tracker function will always keep the session variable containing challenge
// text up to date. That means that it will start blank, then later it will get set
// to a string of text as soon as the database info arrives. And because session data
// is reactive in Meteor, the helper functions that use the session data will update
// automatically.
Tracker.autorun(function() {
	var challenge = _.first(Challenges.find({}).fetch());
	Session.set('challengeText', challenge ? challenge.text : "");
});

Session.set('highlightIndex', 0);
Session.set('futureTextIndex', 0);

Template.body.helpers({
	challengeHistory: function() {
		var challengeText = Session.get('challengeText');
		var highlightIndex = Session.get('highlightIndex');
		return challengeText ? challengeText.substring(0, highlightIndex) : "";
	},
	challengeHighlight: function() {
		var challengeText = Session.get('challengeText');
		var highlightIndex = Session.get('highlightIndex');
		var futureTextIndex = Session.get('futureTextIndex');
		return challengeText ? challengeText.substring(highlightIndex, futureTextIndex) : "";
	},
	challengeFuture: function() {
		var challengeText = Session.get('challengeText');
		var futureTextIndex = Session.get('futureTextIndex');
		return challengeText ? challengeText.substring(futureTextIndex) : "";
	}

});