JSPM-MVN
========

This library provides a maven registry to jspm.

Directory structure
-------------------

- `/java` - jspm-mvn-helper root directory
    - `/src` - source for the helper
    - `/target` - maven target directory  (generated)

- `/javascript` - jspm-mvn registry root directory
    - `/bin` - directory for the `helper-jar-with-dependencies.jar` jar output of the jspm-mvn-helper project (generated)
    - `/coverage` - coverage report directory (generated)
    - `/lib` - typescript output directory (generated)
    - `/node_modules` - NodeJS dependencies (generated)
    - `/spec` - test resources
    - `/src` - typescript source files
    - `/typings` - typescript typings directory (generated)
    - `/typings-custom` - typescript custom typings directory for missing `.d.ts` files

Installation
------------

1. Ensure you have NodeJS, npm and maven installed.
2. Ensure that you have `mvn` command in your `PATH`.
3. Run `npm install` in `/javascript`.

Develop
-------

### JavaScript

- Clean: Run `npm run clean` in `/javascript`.
- Build: Run `npm run build` in `/javascript`.
- Watch: Run `npm run watch` in `/javascript`.
- Test: Run `npm test` in `/javascript`.
- Coverage report: Run `npm run cover` in `/javascript`.

Coverage report will output to `/javascript/coverage`.

### Java

Use the `pom.xml` in `/java`.
