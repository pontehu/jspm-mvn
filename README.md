# Maven Registry Endpoint for JSPM

This package provides maven repository support for [jspm](http://jspm.io/), so you can `jspm install mvn:my-amazing-package`. Works with both jspm `0.16.x` and `0.17.0-beta.x`.

This means you don't need to link or deploy your packages to test them in another project, you can just install them locally using `mvn install` and jspm-mvn will use what maven knows. Because jspm-mvn uses the real maven (hence the java helper) you can even deploy to any maven repository using `mvn deploy` and maven will find and download that for jspm-mvn using your maven rules for update and snapshot intervals.

## Install

- Install globally: `npm install jspm-mvn -g`
- Add to jspm: `jspm registry create mvn jspm-mvn`

## Maven artifact format

A folder named `jspackage` in the root of the artifact which contains the js files and the `package.json` file.

The artifact's version must be semver compatible.<br>
Good versions: `1.2.3`, `1.2.3-SNAPSHOT`<br>
Bad versions: `1.2`, `1.2-SNAPSHOT`

Example packages under `/examples`

### Options

If your `package.json` and `pom.xml` isn't in the same folder you need to specify where jspm-mvn can find the `pom.xml`. In your `package.json` add a `jspm.pomPath` key pointing to the `pom.xml` relative to the `package.json` file. This option is useful for end/webapp maven projects where you need to include the js files in a resource folder.

## Non Goal

**This isn't a new registry for js modules in maven!** This package is to fit your js modules into your maven infrastructure and have the benifit of installing packages/artifacts locally.

## Limitations

- Every js package must be under the same `groupId` *(probably fixable)*
- Cannot use non semver compatible artifact version
- `pom.xml` must provide a repository to resolve from, global config is ignored *(probably fixable)*
