import {Transform} from "stream";

export class CharacterTerminatedToBufferObjectStream extends Transform {
	private _dataBuffer:Buffer;
	constructor(private _terminator:number) {
		super(<any>{
			writableObjectMode:false,
			readableObjectMode:true
		});
	}
	_transform(data:Buffer, enc:string, cb:Function) {
		if (!this._dataBuffer) this._dataBuffer = new Buffer([]); //Make sure we have a dataBuffer

		let startFrom = 0;
		for (let i = 0; i < data.length; ++i) {
			if (data[i] === this._terminator) {
				let finalBuffer = this._dataBuffer;
				if (startFrom < i) {
					finalBuffer = Buffer.concat([finalBuffer, data.slice(startFrom, i)]);
				}
				this.push(finalBuffer);

				this._dataBuffer = new Buffer([]);
				startFrom = i + 1; //Skip this terminator character
			}
		}
		if (startFrom < data.length) { //Append the rest of the buffer
			this._dataBuffer = Buffer.concat([this._dataBuffer, data.slice(startFrom, data.length)]);
		}
		cb();
	}
}

export class BufferObjectToCharacterTerminatedStream extends Transform {
	private _terminatorBuffer:Buffer;
	constructor(terminator:number) {
		super(<any>{
			writableObjectMode:true,
			readableObjectMode:false
		});
		this._terminatorBuffer = new Buffer([terminator]);
	}
	_transform(data:Buffer, enc:string, cb:Function) {
		this.push(Buffer.concat([data, this._terminatorBuffer]));
		cb();
	}
}

export class BufferObjectToJsonStream extends Transform {
	constructor() {
		super({objectMode: true});
	}
	_transform(data:Buffer, enc:string, cb:Function) {
		this.push(JSON.parse(data.toString("utf-8")));
		cb();
	}
}

export class JsonToBufferObjectStream extends Transform {
	constructor() {
		super({objectMode: true});
	}
	_transform(data:any, enc:string, cb:Function) {
		this.push(new Buffer(JSON.stringify(data), "utf-8"));
		cb();
	}
}
