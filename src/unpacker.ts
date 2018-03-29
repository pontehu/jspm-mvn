import * as fs from "fs";
import * as yauzl from "yauzl";
import * as _mkdirp from "mkdirp";
import {Readable} from "stream";
import * as Bluebird from "bluebird";
import * as path from "path";
import * as _pump from "pump";

const mkdirp = Bluebird.promisify<_mkdirp.Made, string>(_mkdirp);
const pump = Bluebird.promisify<any, _pump.Stream[]>(_pump);
const yauzlOpen = Bluebird.promisify(yauzl.open);

async function writeToFile(entry: Readable, p: string) {
	await mkdirp(path.dirname(p));
	await pump([
		entry,
		fs.createWriteStream(p)
	]);
}

async function processZipfile(filePath: string, processor: (entry: yauzl.Entry, zipFile: yauzl.ZipFile) => Promise<void>) {
	const zipFile = await yauzlOpen(filePath, {lazyEntries: true});
	await new Promise<any>((resolve, reject) => {
		zipFile.on("end", resolve);
		zipFile.on("error", reject);
		zipFile.on("entry", async (entry) => {
			try {
				await processor(entry, zipFile);
				zipFile.readEntry();
			} catch(err) {
				reject(err);
				zipFile.close();
			}
		});
		zipFile.readEntry();
	});
}

export async function unpack(filePath:string, innerFolderPath: string, outDir:string) {
	if (!innerFolderPath.endsWith("/")) {
		innerFolderPath = innerFolderPath + "/";
	}
	await processZipfile(filePath, async (entry, zipFile) => {
		const isDir = entry.fileName.endsWith("/");
		if (isDir) return;
		if (entry.fileName.indexOf(innerFolderPath) !== 0) return;

		const openReadStream = Bluebird.promisify(zipFile.openReadStream, {context: zipFile});
		const p = entry.fileName.slice(innerFolderPath.length);
		const outPath = path.resolve(outDir, p);
		const readable = await openReadStream(entry);
		await writeToFile(readable, outPath);
	});
}
