package hu.ponte.jspmmvn;

import com.fasterxml.jackson.core.JsonProcessingException;
import org.apache.maven.repository.internal.DefaultVersionRangeResolver;
import org.apache.maven.repository.internal.MavenRepositorySystemUtils;
import org.eclipse.aether.DefaultRepositorySystemSession;
import org.eclipse.aether.RepositorySystem;
import org.eclipse.aether.RepositorySystemSession;
import org.eclipse.aether.artifact.DefaultArtifact;
import org.eclipse.aether.connector.basic.BasicRepositoryConnectorFactory;
import org.eclipse.aether.impl.DefaultServiceLocator;
import org.eclipse.aether.impl.VersionRangeResolver;
import org.eclipse.aether.repository.LocalRepository;
import org.eclipse.aether.repository.RemoteRepository;
import org.eclipse.aether.resolution.ArtifactRequest;
import org.eclipse.aether.resolution.ArtifactResolutionException;
import org.eclipse.aether.resolution.VersionRangeRequest;
import org.eclipse.aether.resolution.VersionRangeResolutionException;
import org.eclipse.aether.resolution.VersionRangeResult;
import org.eclipse.aether.spi.connector.RepositoryConnectorFactory;
import org.eclipse.aether.spi.connector.transport.TransporterFactory;
import org.eclipse.aether.transport.file.FileTransporterFactory;
import org.eclipse.aether.transport.http.HttpTransporterFactory;
import org.eclipse.aether.version.Version;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class Versions
{
	private List<RemoteRepository> repositories;
	private RepositorySystemSession session;
	private RepositorySystem repositorySystem;

	Versions() {
		ArrayList<RemoteRepository> remoteRepositories = new ArrayList<>();
		String repositoryEnv = System.getenv().get("JSPM_MVN_REPOSITORIES");
		if (repositoryEnv != null) {
			String[] repositoryEnvArray = repositoryEnv.split(",");
			for (String repo : repositoryEnvArray) {
				String id = repo.substring(0, repo.indexOf('='));
				String url= repo.substring(repo.indexOf('=') + 1);
				RemoteRepository remoteRepo = new RemoteRepository.Builder(id, "default", url).build();
				remoteRepositories.add(remoteRepo);
			}
		}

		repositories = remoteRepositories;
		repositorySystem = newRepositorySystem();
		session = createSession(repositorySystem);
	}

	String download(String groupId, String artifactId, String extension, String version) throws ArtifactResolutionException, JsonProcessingException {
		DefaultArtifact artifact = new DefaultArtifact(groupId, artifactId, extension, version);
		ArtifactRequest artifactRequest = new ArtifactRequest();
		artifactRequest.setArtifact(artifact);
		artifactRequest.setRepositories(repositories);

		File file = repositorySystem.resolveArtifact(session, artifactRequest).getArtifact().getFile();
		return file.getAbsolutePath();
	}

	List<String> findVersions(String groupId, String artifactId) throws VersionRangeResolutionException, JsonProcessingException {
		VersionRangeRequest versionRangeRequest = new VersionRangeRequest();
		versionRangeRequest.setArtifact(new org.eclipse.aether.artifact.DefaultArtifact(groupId,artifactId,null,"(0,)"));
		versionRangeRequest.setRepositories(repositories);

		VersionRangeResult versions = repositorySystem.resolveVersionRange(session, versionRangeRequest);
		return versions.getVersions().stream().map(Version::toString).collect(Collectors.toList());
	}

	private static RepositorySystem newRepositorySystem()
	{
		DefaultServiceLocator locator = MavenRepositorySystemUtils.newServiceLocator();
		locator.addService( RepositoryConnectorFactory.class, BasicRepositoryConnectorFactory.class );
		locator.addService( TransporterFactory.class, FileTransporterFactory.class );
		locator.addService( TransporterFactory.class, HttpTransporterFactory.class );
		locator.addService(VersionRangeResolver.class, DefaultVersionRangeResolver.class);
		return locator.getService( RepositorySystem.class );
	}

	private static DefaultRepositorySystemSession createSession(RepositorySystem repositorySystem){
		DefaultRepositorySystemSession session = MavenRepositorySystemUtils.newSession();

		LocalRepository localRepo = new LocalRepository( org.apache.maven.repository.RepositorySystem.defaultUserLocalRepository);
		session.setLocalRepositoryManager(repositorySystem.newLocalRepositoryManager(session,localRepo));
		return session;
	}
}
