
//////// VIEW HELPERS ////////


Template.sidebar.helpers({
	soundSetting: function() {
		var soundSetting = Meteor.users.findOne({_id: Meteor.userId()}).sound;
		return soundSetting;
	},
	isAnyoneOnline: function() {
		return Meteor.users.find({"status.online": true}).count() > 0;
	}
});



//////// EVENT LISTENERS ////////


Template.sidebar.events({
	'click #soundToggle': function(event) {
		event.preventDefault();

		var currentSoundSetting = Meteor.users.findOne({_id: Meteor.userId()}, {fields: {sound: 1}}).sound;
		Meteor.call('setSound', Meteor.userId(), !currentSoundSetting);
	}
})