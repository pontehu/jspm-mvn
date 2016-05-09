/*
======
Unused
======
*/

import {exec} from "child_process";
import * as path from "path";
import * as config from "./config";
import {unpack} from "./unpacker";

const STDOUT_GREP = /\SUCCESS:(.*?)(\r|\n)/;

function execAsync(command:string) {
	return new Promise<string>((resolve, reject) => {
		exec(command, (err, stdout, stderr) => {
			if (err) return reject(err);
			resolve(stdout);
		});
	});
}

async function execHelper(args:string[]) {
	const parts = ["java", "-jar", path.resolve(__dirname, "..", config.helperJarPath)].concat(args).map((part) => {
		return `"${part.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"`;
	});
	const stdout = await execAsync(parts.join(" "));
	const res = STDOUT_GREP.exec(stdout);
	if (!res || !res[1]) {
		throw new Error(`Invalid response:\n${stdout}`);
	}
	return JSON.parse(res[1]);
}

export async function getVersions(packageName: string) {
	const groupId = config.groupId;
	const artifactId = packageName;
	const versions:string[] = await execHelper(["versions", groupId, artifactId]);
	return versions.map((version) => {
		return {
			version: version,
			artifact: {
				groupId: groupId,
				artifactId: artifactId,
				version: version
			}
		};
	});
}

export async function downloadPackage(meta: any, outDir: string) {
	const resPath = await execHelper(["download", meta.artifact.groupId, meta.artifact.artifactId, "jar", meta.artifact.version]);
	await unpack(resPath, outDir);
}
