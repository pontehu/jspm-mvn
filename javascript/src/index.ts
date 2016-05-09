import {Registry} from "./registry";

import jspmConfig = require("jspm/lib/config/global-config");
jspmConfig.config.registries["mvn"] = jspmConfig.config.registries["mvn"] || {
	handler: "jspm-mvn"
};

export = Registry;
