package hu.ponte.jspmmvn;

import org.apache.maven.model.Model;
import org.apache.maven.model.Parent;
import org.apache.maven.model.Repository;
import org.apache.maven.model.RepositoryPolicy;
import org.apache.maven.model.io.xpp3.MavenXpp3Reader;
import org.codehaus.plexus.util.xml.pull.XmlPullParserException;
import org.eclipse.aether.repository.RemoteRepository;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Created with IntelliJ IDEA.
 * User: zenorbi
 * Date: 2017-02-20
 * Time: 17:24
 */
public class RepositoryListResolver
{
	public static void main(String[] args) throws IOException, XmlPullParserException
	{
		List<RemoteRepository> repositories = getRemoteRepositoriesFromPom(new File("pom.xml"));
		System.out.println(repositories);
	}

	static List<RemoteRepository> getRemoteRepositoriesFromPom(File pomFile) throws IOException, XmlPullParserException
	{
		List<Repository> repositoryList = new ArrayList<>();

		while (true)
		{
			MavenXpp3Reader reader = new MavenXpp3Reader();
			Model model = reader.read(new InputStreamReader(new FileInputStream(pomFile), StandardCharsets.UTF_8));

			repositoryList.addAll(model.getRepositories());
			Parent parent = model.getParent();
			if (parent == null)
			{
				break;
			}
			pomFile = new File(pomFile.getParentFile(), parent.getRelativePath());
			if (!pomFile.exists()) {
				break;
			}
		}

		return repositoryList.stream().map(RepositoryListResolver::convertRepositoryToRemoteRepository).collect(Collectors.toList());
	}

	private static RemoteRepository convertRepositoryToRemoteRepository(Repository repository) {
		RemoteRepository.Builder builder = new RemoteRepository.Builder(repository.getId(), repository.getLayout(), repository.getUrl());
		RepositoryPolicy releases = repository.getReleases();
		if (releases != null)
		{
			builder.setReleasePolicy(convertRepositoryPolicy(releases));
		}
		org.apache.maven.model.RepositoryPolicy snapshot = repository.getSnapshots();
		if (snapshot != null)
		{
			builder.setSnapshotPolicy(convertRepositoryPolicy(snapshot));
		}
		return builder.build();
	}

	private static org.eclipse.aether.repository.RepositoryPolicy convertRepositoryPolicy(RepositoryPolicy repositoryPolicy) {
		String updatePolicy = "always"; //Needs to always check the updates for available versions (maven-metadata.xml).
		String checksumPolicy = repositoryPolicy.getChecksumPolicy();
		if (checksumPolicy == null) {
			checksumPolicy = "warn";
		}
		return new org.eclipse.aether.repository.RepositoryPolicy(repositoryPolicy.isEnabled(), updatePolicy, checksumPolicy);
	}
}
