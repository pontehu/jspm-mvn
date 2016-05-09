import {createServer} from "net";
import {BufferObjectToCharacterTerminatedStream, CharacterTerminatedToBufferObjectStream, JsonToBufferObjectStream, BufferObjectToJsonStream} from "./utils/streams";
import * as Promise from "bluebird";
import {spawn, ChildProcess} from "child_process";
import * as path from "path";
import * as config from "./config";

/*
Really basic TCP socket protocol:

Each request is an utf-8 new line (\n) terminated string.
The string is a JSON following this schema:
	[requestId, requestBody]

	where `requestId` is an incrementing integer
	and `requestBody` is the body of the request.

For every request, the client must send a response, which is also an utf-8 new line (\n) terminated string, and is a JSON.
The schema for the response:
	[requestId, responseBody]

	where `requestId` is the id of the corresponding request
	and `responseBody` is the body of the response.
*/

function runMavenWithPort(port: number) {
	const jarPath = path.resolve(__dirname, "..", config.helperJarPath);
	const repositoriesString = Object.keys(config.jspmMvnRepositories).map((name) => {
		return name + "=" + config.jspmMvnRepositories[name];
	}).join(",");
	const environment = {
		"JSPM_MVN_REPOSITORIES": repositoriesString
	};
	return spawn("java", ["-jar", jarPath, "connect", "" + port], {
		stdio: "inherit",
		env: environment
	});
}

interface MavenConnection {
	writer: JsonToBufferObjectStream;
	reader: BufferObjectToJsonStream;
	retain:() => void;
	release:() => void;
}

function createMavenConnection() {
	return new Promise<MavenConnection>((resolve, reject) => {
		let timeout:NodeJS.Timer;
		function cancelTimeout() {
			clearTimeout(timeout);
		}

		let mavenInstance: ChildProcess;
		const server = createServer((mavenSocket) => {
			cancelTimeout();
			server.close(); //Stop accepting new connections

			const newLine = "\n".charCodeAt(0);

			const charTerminatedParser = new CharacterTerminatedToBufferObjectStream(newLine);
			const charTerminatedSerializer = new BufferObjectToCharacterTerminatedStream(newLine);
			const jsonParser = new BufferObjectToJsonStream();
			const jsonSerializer = new JsonToBufferObjectStream();

			mavenInstance.unref();
			mavenSocket.unref();

			mavenSocket
				.pipe(charTerminatedParser)
				.pipe(jsonParser);

			jsonSerializer
				.pipe(charTerminatedSerializer)
				.pipe(mavenSocket);

			let refCount = 0;
			const retain = () => {
				if (refCount === 0) {
					mavenSocket.ref();
				}
				++refCount;
			};
			const release = () => {
				--refCount;
				if (refCount === 0) {
					mavenSocket.unref();
				}
			};

			resolve({
				writer: jsonSerializer,
				reader: jsonParser,
				retain: retain,
				release: release
			});
		});
		server.listen(0, "localhost", (err: Error) => {
			if (err) return reject(err);
			const address = server.address();
			mavenInstance = runMavenWithPort(address.port);

			timeout = setTimeout(() => {
				server.close();
				mavenInstance.kill();
				reject(new Error(`Timeout connecting to maven on port ${address.port}`));
			}, 3000);
		});
	});
}

let mavenConnectionPromise: Promise<MavenConnection>;
function getMavenConnection() {
	if (!mavenConnectionPromise) {
		mavenConnectionPromise = createMavenConnection();
	}
	return mavenConnectionPromise;
}

let requestCounter = 0;
export async function sendRequest(command: any) {
	return getMavenConnection().then((connection) => {
		return new Promise<any>((resolve, reject) => {
			const requestId = ++requestCounter;

			connection.retain();
			connection.writer.write([requestId, command]);

			connection.reader.addListener("data", function reader(json: any) {
				if (json[0] === requestId) {
					connection.reader.removeListener("data", reader);

					connection.release();

					if (typeof json[1] === "object" && json[1].errored) {
						reject(new Error(json[1].message));
						return;
					}
					resolve(json[1]);
				}
			});
		});
	});
}
