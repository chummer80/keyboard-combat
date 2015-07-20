Template.sidebar.helpers({
	soundSetting: function() {
		var soundSetting = Meteor.users.findOne({_id: Meteor.userId()}).sound;
		return soundSetting;
	},
	isAnyoneOnline: function() {
		return Meteor.users.find({"status.online": true}).count() > 0;
	}
});