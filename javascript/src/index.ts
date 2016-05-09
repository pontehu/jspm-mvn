import {Registry} from "./registry";

//Monkey patch jspm's registry configuration, so you can use `mvn:` without installing jspm and jspm-mvn globally.
import jspmConfig = require("jspm/lib/config/global-config");
jspmConfig.config.registries["mvn"] = jspmConfig.config.registries["mvn"] || {
	handler: "jspm-mvn"
};

export = Registry;
