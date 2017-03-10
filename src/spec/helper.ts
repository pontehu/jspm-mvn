import * as path from "path";
import {exec} from "child_process";

export function testWrap(test:() => PromiseLike<any>) {
	return (done:Function) => {
		try {
			test().then(() => {
				done();
			}, (e) => {
				expect(() => {throw e;}).not.toThrow();
				done();
			});
		} catch(e) {
			expect(() => {throw e;}).not.toThrow();
			done();
		}
	};
}

export function getMavenPackagePath(packageName:string, subpath?:string) {
	const p = path.resolve(__dirname, "../../spec/support/packages", packageName);
	if (subpath) {
		return path.join(p, subpath);
	}
	return p;
}

export function mvnCleanInstall(packageName:string) {
	const pom = path.join(getMavenPackagePath(packageName), "pom.xml");
	return new Promise((resolve, reject) => {
		exec(`mvn -f ${pom} clean install`, (err, stdout, stderr) => {
			if (err) return reject(err);
			resolve();
		});
	});
}
