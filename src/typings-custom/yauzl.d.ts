declare module "yauzl" {
	import {EventEmitter} from "events";
	import {Readable} from "stream";

	export function open(path: string, options: { autoClose?: boolean, lazyEntries?: boolean }, callback: (err: Error, zipFile: ZipFile) => void): void;

	export class ZipFile extends EventEmitter {
		readEntry(): void;
		on(name: "entry", func: (entry: Entry) => void): this;
		on(name: string, func: Function): this;

		openReadStream(entry:Entry, callback:(err:Error, readStream:Readable) => void):void;
	}

	export class Entry {
		fileName:string;
	}
}
