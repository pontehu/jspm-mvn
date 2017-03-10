package hu.ponte.jspmmvn;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.codehaus.plexus.util.xml.pull.XmlPullParserException;
import org.eclipse.aether.resolution.ArtifactResolutionException;
import org.eclipse.aether.resolution.VersionRangeResolutionException;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Created with IntelliJ IDEA.
 * User: zenorbi
 * Date: 2016-05-05
 * Time: 17:12
 */
public class Main {
    private static Versions versions;
    public static void main(String[] args) {
        if (args.length == 0) {
            printHelp();
            System.exit(1);
            return;
        }
        try {
            Object out;
            switch (args[0]) {
                case "download":
                    out = Main.download(Arrays.copyOfRange(args, 1, args.length));
                    break;
                case "versions":
                    out = Main.versions(Arrays.copyOfRange(args, 1, args.length));
                    break;
                case "connect":
                    Main.connect(Arrays.copyOfRange(args, 1, args.length));
                    System.exit(0);
                    return;
                default:
                    System.out.println("Unsupported command");
                    printHelp();
                    System.exit(1);
                    return;
            }
            ObjectMapper mapper = new ObjectMapper();
            System.out.println("SUCCESS:" + mapper.writeValueAsString(out));
        } catch (ArtifactResolutionException | VersionRangeResolutionException | IOException | XmlPullParserException e) {
            e.printStackTrace();
            System.exit(1);
        }
    }
    private static Versions getRequestHandler() throws IOException, XmlPullParserException
    {
        if (versions == null) {
            versions = new Versions(new File(System.getProperty("pomfile")));
        }
        return versions;
    }
    private static String download(String[] args) throws ArtifactResolutionException, IOException, XmlPullParserException
    {
        return getRequestHandler().download(args[0], args[1], args[2], args[3]);
    }
    private static List<String> versions(String[] args)
        throws ArtifactResolutionException, IOException, VersionRangeResolutionException, XmlPullParserException
    {
        return getRequestHandler().findVersions(args[0], args[1]);
    }
    private static void connect(String[] args) throws IOException, XmlPullParserException
    {
        ObjectMapper objectMapper = new ObjectMapper();
        Socket socket = new Socket("localhost", Integer.parseInt(args[0]));
        InputStream inputStream = socket.getInputStream();
        OutputStream outputStream = socket.getOutputStream();
        BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8));
        String line;
        while ((line = bufferedReader.readLine()) != null) {
            JsonNode jsonNode = objectMapper.readTree(line);
            int requestId = jsonNode.get(0).asInt();
            JsonNode body = jsonNode.get(1);
            String command = body.get("command").asText();

            Object jsonResp;
            try {
                switch (command) {
                    case "versions":
                        jsonResp = getRequestHandler().findVersions(body.get("groupId").asText(), body.get("artifactId").asText());
                        break;
                    case "download":
                        jsonResp = getRequestHandler().download(body.get("groupId").asText(), body.get("artifactId").asText(), "jar", body.get("version").asText());
                        break;
                    default:
                        jsonResp = new JsonError(new Exception("Unsupported command"));
                }
            } catch(VersionRangeResolutionException | ArtifactResolutionException e) {
                jsonResp = new JsonError(e);
            }

            List<Object> response = new ArrayList<>();
            response.add(requestId);
            response.add(jsonResp);

            outputStream.write(objectMapper.writeValueAsBytes(response));
            outputStream.write('\n');
        }
    }
    private static void printHelp() {
        System.out.println("Every command's output is prefixed with 'SUCCESS: ' and is new line terminated.");
        System.out.println("commands:");
        System.out.println("    download <groupId> <artifactId> <extension> <version>");
        System.out.println("        Downloads the artifact and returns the path of the downloaded file.");
        System.out.println("");
        System.out.println("    versions <groupId> <artifactId>");
        System.out.println("        Returns the available versions for the given artifact.");
        System.out.println("");
        System.out.println("    connect <port>");
        System.out.println("        TCP Connects to the given port and awaits commands.");
    }
}
