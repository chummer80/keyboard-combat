Template.sidebar.helpers({
	soundSetting: function() {
		var soundSetting = Meteor.users.findOne({_id: Meteor.userId()}).sound;
		return soundSetting;
	}
});