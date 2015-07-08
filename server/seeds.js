Meteor.startup(function () {
	Challenges.remove({});
	// code to run on server at startup
	if (Challenges.find({}).count() === 0) {
		Challenges.insert({
			text: "Testing testing 123."
		});
		Challenges.insert({
			text: "Dr. Seuss - Love & Weirdness\nWe are all a little weird and life's a little weird, and when we find someone whose weirdness is compatible with ours, we join up with them and fall in mutual weirdness and call it love."
		});
		Challenges.insert({
			text: "Francis Bacon - Integrity\nIt's not what we eat but what we digest that makes us strong; not what we gain but what we save that makes us rich; not what we read but what we remember that makes us learned; and not what we profess but what we practice that gives us integrity."
		});
		Challenges.insert({
			text: "Abraham Lincoln - Katherine\nI am not bound to win, but I am bound to be true. I am not bound to succeed, but I am bound to live by the light that I have. I must stand with anybody that stands right, and stand with him while he is right, and part with him when he goes wrong."
		});
		Challenges.insert({
			text: "Albert Einstein\nI am enough of an artist to draw freely upon my imagination. Imagination is more important than knowledge. Knowledge is limited. Imagination encircles the world."
		});
		Challenges.insert({
			text: "Lemony Snicket - Trust\nDeciding whether or not to trust a person is like deciding whether or not to climb a tree because you might get a wonderful view from the highest branch or you might simply get covered in sap and for this reason many people choose to spend their time alone and indoors where it is harder to get a splinter."
		});
		Challenges.insert({
			text: "J. K. Rowling\nIt is impossible to live without failing at something, unless you live so cautiously that you might as well not have lived at all -- in which case, you fail by default."
		});
		Challenges.insert({
			text: "Confucius\nTo put the world in order, we must first put the nation in order; to put the nation in order, we must put the family in order; to put the family in order, we must cultivate our personal life; and to cultivate our personal life, we must first set our hearts right."
		});
	}
});
