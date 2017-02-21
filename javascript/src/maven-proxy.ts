import {createMavenConnection, MavenConnection} from "./maven-connector";
import * as Bluebird from "bluebird";
import * as fs from "fs";
import * as path from "path";

const readFile = Bluebird.promisify<string, string, string>(fs.readFile);
const access = Bluebird.promisify<void, string, number>(fs.access);

export class MavenJspmProxy {
	private _mavenConnectionPromise: Promise<MavenConnection>;
	private _requestCounter: number = 0;
	private _packageJsonPath:string;

	constructor(packageJsonPath:string) {
		this._packageJsonPath = packageJsonPath;
	}

	private async _getPossiblePomPath() {
		const packageJsonFile = await readFile(this._packageJsonPath, "utf-8");
		const json = JSON.parse(packageJsonFile);
		if (typeof json.jspm === "object" && typeof json.jspm.pomPath === "string") {
			return path.resolve(path.dirname(this._packageJsonPath), json.jspm.pomPath);
		} else {
			return path.resolve(path.dirname(this._packageJsonPath), "pom.xml");
		}
	}

	private async _getPomPath() {
		const possiblePomPath = await this._getPossiblePomPath();
		try {
			await access(possiblePomPath, fs.constants.R_OK);
		} catch(e) {
			throw Error(`jspm-mvn: Failed to access ${possiblePomPath}. Make sure the pom.xml is either in your current working directory, or configure jspm.pomPath in your package.json file. The path is relative to the package.json file.`);
		}
		return possiblePomPath;
	}

	private async _createMavenConnection() {
		const pomPath = await this._getPomPath();
		const env = new Map<string, string>();
		env.set("pomfile", pomPath);
		return await createMavenConnection(env);
	}

	private _getMavenConnection() {
		if (!this._mavenConnectionPromise) {
			this._mavenConnectionPromise = this._createMavenConnection();
		}
		return this._mavenConnectionPromise;
	}

	async sendRequest<T>(command: any) {
		const connection = await this._getMavenConnection();
		return await new Promise<T>((resolve, reject) => {
			const requestId = ++this._requestCounter;

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
	}
}
