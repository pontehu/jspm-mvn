Guide to Debugging
==================

- `mvn clean install`
- The output jar-with-dependencies is at `../java-helper/helper-jar-with-dependencies.jar`
- Prepare a `pom.xml` that contains a repositories entry listing your remote repositories.
- Debug version resolving: `java -Dpomfile="path/to/pom.xml" -jar helper-jar-with-dependencies.jar versions my.group.id myartifactid`
