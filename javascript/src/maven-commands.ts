import * as config from "./config";
import {unpack} from "./unpacker";
import {sendRequest} from "./maven-connector";


export async function getVersions(packageName: string) {
	const packageGroups = packageName.split("/");
	const artifactId = packageGroups.pop();
	const groupId = [config.groupId].concat(packageGroups).join(".");
	const versions: string[] = await sendRequest({ command: "versions", groupId: groupId, artifactId: artifactId });
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
	const resPath = await sendRequest({ command: "download", groupId: meta.artifact.groupId, artifactId: meta.artifact.artifactId, version: meta.artifact.version });
	await unpack(resPath, outDir);
}
