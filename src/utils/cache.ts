export interface ICacheConfig {
	storeNegative?: boolean;
}

export class SingleValueCache<TValue> {
	private _cache: Promise<TValue>|undefined;
	private _storeNegative: boolean;

	constructor(config?: ICacheConfig) {
		this._storeNegative = false;
		if (config) {
			this._storeNegative = config.storeNegative || false;
		}
	}

	has() {
		return this._cache !== undefined;
	}

	clear() {
		this._cache = undefined;
	}

	get(factory: () => Promise<TValue>) {
		const prom = this._cache;
		if (prom) return prom;

		const result = factory();
		this._cache = result;

		if (!this._storeNegative) {
			result.catch(() => this._cache = undefined);
		}
		return result;
	}
}
