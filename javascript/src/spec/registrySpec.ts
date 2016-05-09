import {Registry} from "../registry";
import {IVersion} from "../registry-interface";
import {mvnCleanInstall, getMavenPackagePath, testWrap} from "./helper";
import * as path from "path";
import * as fs from "fs";
import * as rimraf from "rimraf";

jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
describe("Registry", () => {
	const SIMPLE_PACKAGE = "jspm-mvn-test-simple-package";
	const SIMPLE_PACKAGE_1_0_0 = "jspm-mvn-test-simple-package-1.0.0";
	const SIMPLE_PACKAGE_1_0_1 = "jspm-mvn-test-simple-package-1.0.1";
	const tempDir = path.resolve(__dirname, "../../spec/support/tempDir");

	let registry:Registry;
	beforeAll(testWrap(async () => {
		process.stdout.write("Installing test maven packages... ");
		await Promise.all([mvnCleanInstall(SIMPLE_PACKAGE_1_0_0), mvnCleanInstall(SIMPLE_PACKAGE_1_0_1)]);
		console.log("Done");
	}));
	beforeEach(() => {
		rimraf.sync(tempDir);
		registry = new Registry();
	});
	afterEach(() => {
		rimraf.sync(tempDir);
	});

	it("should return notfound for unknown packages", testWrap(async () => {
		const res = await registry.lookup("jspm-mvn-test-does-not-exist");
		expect(res).toEqual({notfound:true});
	}));
	it("should return the available versions for a known package", testWrap(async () => {
		const versions = await registry.lookup(SIMPLE_PACKAGE);
		expect(versions).toEqual({
			versions: {
				"1.0.0-SNAPSHOT": {
					hash: jasmine.any(String),
					meta: jasmine.any(Object)
				},
				"1.0.1-SNAPSHOT": {
					hash: jasmine.any(String),
					meta: jasmine.any(Object)
				}
			}
		});
	}));
	it("should be able to download available version1", testWrap(async () => {
		const versions = <{versions:{[version:string]:IVersion}}>(await registry.lookup(SIMPLE_PACKAGE));
		const ver = versions.versions["1.0.0-SNAPSHOT"];
		const result = await registry.download(SIMPLE_PACKAGE, "1.0.0-SNAPSHOT", ver.hash, ver.meta, tempDir);

		const originalPackageJson = JSON.parse(fs.readFileSync(getMavenPackagePath(SIMPLE_PACKAGE_1_0_0, "src/package.json"), "utf-8"));
		expect(result).toEqual(originalPackageJson);

		const unpackedPackageJson = JSON.parse(fs.readFileSync(path.join(tempDir, "package.json"), "utf-8"));
		expect(originalPackageJson).toEqual(unpackedPackageJson);

		const randomFileInPackagePath = fs.readFileSync(getMavenPackagePath(SIMPLE_PACKAGE_1_0_0, "src/consts/hello.js"), "utf-8");
		const sameFileInUnpacked = fs.readFileSync(path.join(tempDir, "consts/hello.js"), "utf-8");
		expect(randomFileInPackagePath).toEqual(sameFileInUnpacked);
	}));
	it("should be able to download available version2", testWrap(async () => {
		const versions = <{versions:{[version:string]:IVersion}}>(await registry.lookup(SIMPLE_PACKAGE));
		const ver = versions.versions["1.0.1-SNAPSHOT"];
		const result = await registry.download(SIMPLE_PACKAGE, "1.0.1-SNAPSHOT", ver.hash, ver.meta, tempDir);

		const originalPackageJson = JSON.parse(fs.readFileSync(getMavenPackagePath(SIMPLE_PACKAGE_1_0_1, "src/package.json"), "utf-8"));
		expect(result).toEqual(originalPackageJson);

		const unpackedPackageJson = JSON.parse(fs.readFileSync(path.join(tempDir, "package.json"), "utf-8"));
		expect(originalPackageJson).toEqual(unpackedPackageJson);

		const randomFileInPackagePath = fs.readFileSync(getMavenPackagePath(SIMPLE_PACKAGE_1_0_1, "src/consts/world.js"), "utf-8");
		const sameFileInUnpacked = fs.readFileSync(path.join(tempDir, "consts/world.js"), "utf-8");
		expect(randomFileInPackagePath).toEqual(sameFileInUnpacked);
	}));
});
