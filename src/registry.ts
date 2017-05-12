import {readFile as _fsReadFile} from "fs";
import * as path from "path";
import * as Bluebird from "bluebird";
import {IJSPMRegistry, NotFound, ILookupResult} from "./registry-interface";
import {downloadPackage, getVersions} from "./maven-commands";
import {MavenJspmProxy} from "./maven-proxy";
import * as config from "./config";

const fsReadFile = Bluebird.promisify<string, string, string>(_fsReadFile);

let cwd = ".";
export function setCWD(newCWD: string) {
	cwd = newCWD;
}

export interface IOptions {
	groupId: string;
	packagePathInArtifact?: string;
}

export class Registry implements IJSPMRegistry {
	private _mavenProxy: MavenJspmProxy;

	private _groupId: string;
	private _packagePathInArtifact: string;

	constructor(options: IOptions) {
		this._groupId = options.groupId;
		this._packagePathInArtifact = options.packagePathInArtifact || config.packagePathInArtifact;
		this._mavenProxy = new MavenJspmProxy(path.join(cwd, "package.json"));
	}

	async lookup(packageName: string): Promise<ILookupResult> {
		const versions = await getVersions(this._mavenProxy, this._groupId, packageName);
		if (versions.length === 0) return NotFound;
		const versionMap: any = {};
		versions.forEach((version) => {
			versionMap[version.version] = {
				hash: version.hash,
				meta: version
			};
		});
		return { versions: versionMap };
	}

	async download(packageName: string, version: string, hash: string, meta: any, dir: string) {
		await downloadPackage(this._mavenProxy, meta, this._packagePathInArtifact, dir);
		return JSON.parse(await fsReadFile(path.join(dir, "package.json"), "utf-8"));
	}

	static async configure(config: any, ui: any) {
		config.groupId = await ui.input("Enter the groupId where jspm-mvn should look for the js packages (ex.: com.mycomp.js)", config.groupId);
		config.packagePathInArtifact = await ui.input("Enter the path of the package folder inside the artifact (ex.: META-INF/resources)", "jspackage");
		return config;
	}
}
