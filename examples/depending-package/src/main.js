define(["exports", "simple-package"], function(exports, simplePackage) {
	exports.printHello = function() {
		console.log(simplePackage.getHello());
	};
});
