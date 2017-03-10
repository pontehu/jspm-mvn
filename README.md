# Maven Registry Endpoint for JSPM

This package provides maven repository support for [jspm](http://jspm.io/), so you can `jspm install mvn:my-amazing-package`. Works with both jspm `0.16.x` and `0.17.0-beta.x`.

## Install

- Install globally: `npm install jspm-mvn -g`
- Add to jspm: `jspm registry create mvn jspm-mvn`

## Maven artifact format

A folder named `jspackage` in the root of the artifact which contains the js files and the `package.json` file.

The artifact's version must be semver compatible.
Good versions: `1.2.3`, `1.2.3-SNAPSHOT`
Bad versions: `1.2`, `1.2-SNAPSHOT`

Example packages under `/examples`

## Non Goal

**This isn't a new registry for js modules in maven!** This package is to fit your js modules into your maven infrastructure and have the benifit of installing packages/artifacts locally.

## Limitations

- Every js package must be under the same `groupId` *(probably fixable)*
- Cannot use non semver compatible artifact version
- `pom.xml` must provide a repository to resolve from, global config is ignored *(probably fixable)*
