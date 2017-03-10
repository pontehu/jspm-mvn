define(["exports", "./consts/hello"], function(exports, hello) {
	exports.getHello = function() {
		return hello.hello;
	};
});
