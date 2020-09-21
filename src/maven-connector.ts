import {createServer, Server} from "net";
import {
	BufferObjectToCharacterTerminatedStream,
	CharacterTerminatedToBufferObjectStream,
	JsonToBufferObjectStream,
	BufferObjectToJsonStream
} from "./utils/streams";
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

function runMaven(port: number, env: Map<string, string>) {
	const jarPath = path.resolve(__dirname, "..", config.helperJarPath);
	const args: string[] = [];
	env.forEach((value, key) => {
		args.push(`-D${key}=${value}`);
	});
	if (process.env.JSPM_MVN_USER_HOME) {
		args.push(`-Duser.home=${process.env.JSPM_MVN_USER_HOME}`);
	}
	args.push("-jar", jarPath, "connect", "" + port);
	return spawn("java", args, {
		stdio: "inherit"
	});
}

export interface MavenConnection {
	writer: JsonToBufferObjectStream;
	reader: BufferObjectToJsonStream;
	retain: () => void;
	release: () => void;
}

function listenOnRandom(server: Server, host: string) {
	return new Promise<void>((resolve, reject) => {
		function retry(retryCount: number) {
			function cleanup() {
				server.removeListener("listening", listeningHandler);
				server.removeListener("error", errorHandler);
			}
			function listeningHandler() {
				cleanup();
				resolve();
			}
			function errorHandler(err: Error) {
				cleanup();
				if ((err as any).code === "EADDRINUSE") {
					if (retryCount >= 10) {
						reject(err);
					} else {
						retry(retryCount + 1);
					}
				} else {
					reject(err);
				}
			}
			server.on("listening", listeningHandler);
			server.on("error", errorHandler);

			server.listen(0, host);
		}

		retry(0);
	});
}

export function createMavenConnection(env: Map<string, string>) {
	return new Promise<MavenConnection>((resolve, reject) => {
		let timeout: NodeJS.Timer;

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

		listenOnRandom(server, "localhost").then(() => {
			const address = server.address();
			mavenInstance = runMaven(address.port, env);
			mavenInstance.on("close", (code, signal) => {
				reject(new Error(`Maven exited with code ${code}`));
			});

			timeout = setTimeout(() => {
				server.close();
				mavenInstance.kill();
				reject(new Error(`Timeout connecting to maven on port ${address.port}`));
			}, 10000);
		}, (err) => {
			reject(err);
		});
	});
}
