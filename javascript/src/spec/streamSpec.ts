import {CharacterTerminatedToBufferObjectStream} from "../utils/streams";

describe("character terminated to buffer object stream", () => {
	it("should push values", (cb) => {
		const buffer = new CharacterTerminatedToBufferObjectStream("\n".charCodeAt(0));
		const data:string[] = [];
		buffer.on("data", (d:any) => {
			data.push(d.toString());
		});
		buffer.write("hello\n");
		buffer.end();
		buffer.on("end", () => {
			expect(data).toEqual(["hello"]);
			cb();
		});
	});

	it("should push multiple values", (cb) => {
		const buffer = new CharacterTerminatedToBufferObjectStream("\n".charCodeAt(0));
		const data:string[] = [];
		buffer.on("data", (d:any) => {
			data.push(d.toString());
		});
		buffer.write("hello\nworld\n");
		buffer.end();
		buffer.on("end", () => {
			expect(data).toEqual(["hello", "world"]);
			cb();
		});
	});
});
