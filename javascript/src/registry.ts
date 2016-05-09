import {readFile as _fsReadFile} from "fs";
import * as path from "path";
import * as Promise from "bluebird";
import {IJSPMRegistry, NotFound, ILookupResult} from "./registry-interface";
import {downloadPackage, getVersions} from "./maven-commands";

const fsReadFile = Promise.promisify<string, string, string>(_fsReadFile);

export class Registry implements IJSPMRegistry {
	async lookup(packageName:string):Promise<ILookupResult> {
		const versions = await getVersions(packageName);
		if (versions.length === 0) return NotFound;
		const versionMap:any = {};
		versions.forEach((version) => {
			versionMap[version.version] = {
				hash: version.version + Date.now(),
				meta: version
			};
		});
		return {versions: versionMap};
	}
	async download(packageName: string, version: string, hash: string, meta: any, dir: string) {
		await downloadPackage(meta, dir);
		return JSON.parse(await fsReadFile(path.join(dir, "package.json"), "utf-8"));
	}
}
