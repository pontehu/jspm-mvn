import {unpack} from "./unpacker";
import {MavenJspmProxy} from "./maven-proxy";


export async function getVersions(mavenProxy:MavenJspmProxy, groupId: string, packageName: string) {
	const packageGroups = packageName.split("/");
	const artifactId = packageGroups.pop();
	const fullGroupId = [groupId].concat(packageGroups).join(".");
	const pjsonProm = mavenProxy.getPackageJson();
	const versionsProm: Promise<string[]> = mavenProxy.sendRequest<string[]>({ command: "versions", groupId: fullGroupId, artifactId: artifactId });

	await Promise.all([pjsonProm, versionsProm]);

	const versions = await versionsProm;
	const pjson = await pjsonProm;
	return versions.map((version) => {
		let hash = undefined;
		if (pjson.jspm && pjson.jspm.mvnHashes) {
			const hashes = pjson.jspm.mvnHashes;
			const id = `${artifactId}@${version}`;
			hash = hashes[id];
		}
		if (!hash) {
			hash = "unknown" + Date.now(); //Could not be determined
		}
		return {
			version: version,
			hash: hash,
			artifact: {
				groupId: groupId,
				artifactId: artifactId,
				version: version
			}
		};
	});
}

export async function downloadPackage(mavenProxy:MavenJspmProxy, meta: any, packagePathInArtifact: string, outDir: string) {
	const resPath = await mavenProxy.sendRequest<string>({ command: "download", groupId: meta.artifact.groupId, artifactId: meta.artifact.artifactId, version: meta.artifact.version });
	await unpack(resPath, packagePathInArtifact, outDir);
}
