import * as fs from "fs";
import * as yauzl from "yauzl";
import * as _mkdirp from "mkdirp";
import {Readable} from "stream";
import * as Bluebird from "bluebird";
import * as path from "path";

const mkdirp = Bluebird.promisify(_mkdirp);

async function writeToFile(entry:Readable, p:string) {
	await mkdirp(path.dirname(p));
	await new Promise<void>((resolve, reject) => {
		entry
			.pipe(fs.createWriteStream(p))
			.on("finish", () => {
				resolve(void 0);
			});
	});
}

export async function unpack(filePath:string, innerFolderPath: string, outDir:string) {
	if (!innerFolderPath.endsWith("/")) {
		innerFolderPath = innerFolderPath + "/";
	}
	const zipFile = await Bluebird.promisify(yauzl.open)(filePath, {lazyEntries: true});

	const endPromise = new Promise<any>((resolve, reject) => zipFile.on("end", resolve));

	async function processEntry(entry:yauzl.Entry) {
		const isDir = entry.fileName.endsWith("/");
		if (isDir) return;
		if (entry.fileName.indexOf(innerFolderPath) !== 0) return;
		const p = entry.fileName.slice(innerFolderPath.length);
		const outPath = path.resolve(outDir, p);
		const readable = await Bluebird.promisify(zipFile.openReadStream, {context: zipFile})(entry);
		await writeToFile(readable, outPath);
	}

	zipFile.on("entry", (entry) => {
		processEntry(entry).then(() => {
			zipFile.readEntry();
		});
	});
	zipFile.readEntry();

	await endPromise;
}
