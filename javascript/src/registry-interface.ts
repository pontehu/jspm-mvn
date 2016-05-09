export const NotFound = {
	notfound: true
};

export interface IVersion {
	hash: string;
	meta?: any;
	stable?: boolean;
}

export type ILookupResult = typeof NotFound|{versions: {[versionId:string]:IVersion}};

export interface IJSPMRegistry {
	locate?(packageName: string): PromiseLike<typeof NotFound | { redirect: string }>;
	lookup(packageName: string): PromiseLike<ILookupResult>;
	download(packageName: string, version: string, hash: string, meta: any, dir: string): PromiseLike<Object>;
}
