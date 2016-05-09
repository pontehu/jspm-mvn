declare module "jspm/lib/config/global-config" {
	export interface IRegistry {
		handler:string;
	}
	export interface IConfig {
		registries:{[name:string]:IRegistry};
	}
	export const config:IConfig;
}
