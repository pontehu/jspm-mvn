SystemJS.config({
  paths: {
    "mvn:": "jspm_packages/mvn/"
  }
});

SystemJS.config({
  packageConfigPaths: [
    "mvn:*.json"
  ],
  map: {
    "simple-package": "mvn:simple-package@1.0.0"
  },
  packages: {}
});
