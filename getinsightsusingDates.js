require('dotenv').config();
const { Octokit } = require('@octokit/rest');

async function getGitHubInsightsForMonth(owner, repo, year, month) {
  const octokit = new Octokit({ auth: process.env.ACCESS_TOKEN });

  try {
    // Get the start and end dates of the month
    // const startDate = new Date(year, month - 1, 1);
    // const endDate = new Date(year, month, 0);
    const startDate = new Date('2023-06-01');
    const endDate = new Date('2023-06-30');
    const startISODate = startDate.toISOString();
    const endISODate = endDate.toISOString();

    // Get the merged pull requests
    let page = 1;
    let mergedPRsThisMonth = [];

    while (true) {
      const { data: mergedPRs } = await octokit.pulls.list({
        owner,
        repo,
        state: 'closed',
        sort: 'created',
        direction: 'desc',
        per_page: 100,
        page,
      });

      const prsInDateRange = mergedPRs.filter(
        (pr) =>
          pr.merged_at &&
          new Date(pr.merged_at) >= startDate &&
          new Date(pr.merged_at) <= endDate
      );

      mergedPRsThisMonth = mergedPRsThisMonth.concat(prsInDateRange);

      if (prsInDateRange.length < 100) {
        break;
      }

      page++;
    }

    // Print the titles of merged PRs
    console.log('\nMerged PR Titles:');
    console.log('------------------');
    for (const pr of mergedPRsThisMonth) {
      console.log(pr.title);
    }

    // Get the open pull requests
    const { data: openPRs } = await octokit.pulls.list({
      owner,
      repo,
      state: 'open',
      per_page: 100,
      page: 1,
    });

    const openPRsThisMonth = openPRs.filter(
      (pr) => new Date(pr.created_at) >= startDate && new Date(pr.created_at) <= endDate
    );

    // Print the titles of open PRs
    console.log('\nOpen PR Titles:');
    console.log('----------------');
    for (const pr of openPRsThisMonth) {
      console.log(pr.title);
    }

    // Get the closed issues
    const { data: closedIssues } = await octokit.issues.listForRepo({
      owner,
      repo,
      state: 'closed',
      sort: 'created',
      direction: 'desc',
      per_page: 100,
      page: 1,
    });

    const closedIssuesThisMonth = closedIssues.filter(
      (issue) =>
        new Date(issue.closed_at) >= startDate && new Date(issue.closed_at) <= endDate
    );

    // Get the new issues
    const { data: newIssues } = await octokit.issues.listForRepo({
      owner,
      repo,
      state: 'open',
      sort: 'created',
      direction: 'asc',
      per_page: 100,
      page: 1,
    });

    const newIssuesThisMonth = newIssues.filter(
      (issue) => new Date(issue.created_at) >= startDate && new Date(issue.created_at) <= endDate
    );

    // Get the commits to master branch
    const { data: commitsToMaster } = await octokit.repos.listCommits({
      owner,
      repo,
      sha: 'master',
      since: startISODate,
      until: endISODate,
      per_page: 100,
      page: 1,
    });

    // Get the commits to all branches
    const { data: commitsToAllBranches } = await octokit.repos.listCommits({
      owner,
      repo,
      since: startISODate,
      until: endISODate,
      per_page: 100,
      page: 1,
    });

    // Get the contributors
    const { data: contributors } = await octokit.repos.listContributors({
      owner,
      repo,
      per_page: 100,
      page: 1,
    });

    // Get the number of files changed, insertions, and deletions
    let filesChanged = 0;
    let insertions = 0;
    let deletions = 0;

    for (const commit of commitsToAllBranches) {
      const { data: commitDetails } = await octokit.repos.getCommit({
        owner,
        repo,
        ref: commit.sha,
      });

      filesChanged += commitDetails.files.length;
      insertions += commitDetails.stats.additions;
      deletions += commitDetails.stats.deletions;
    }

    const result = {
      mergedPRs: mergedPRsThisMonth.length,
      openPRs: openPRsThisMonth.length,
      closedIssues: closedIssuesThisMonth.length,
      newIssues: newIssuesThisMonth.length,
      commitsToMaster: commitsToMaster.length,
      commitsToAllBranches: commitsToAllBranches.length,
      contributors: contributors.length,
      filesChanged,
      insertions,
      deletions,
    };

    console.log('\nInsights for', startDate.toLocaleString('default', { month: 'long' }), year);
    console.log('------------------------------------');
    console.log('Merged PRs:', result.mergedPRs);
    console.log('Open PRs:', result.openPRs);
    console.log('Closed Issues:', result.closedIssues);
    console.log('New Issues:', result.newIssues);
    console.log('Commits to master branch:', result.commitsToMaster);
    console.log('Commits to all branches:', result.commitsToAllBranches);
    console.log('Contributors:', result.contributors);
    console.log('Files Changed:', result.filesChanged);
    console.log('Insertions:', result.insertions);
    console.log('Deletions:', result.deletions);

    // Get the authors and their contributions
    const authorContributions = {};

    for (const commit of commitsToAllBranches) {
      const { data: commitDetails } = await octokit.repos.getCommit({
        owner,
        repo,
        ref: commit.sha,
      });

      const author = commitDetails.author.login;
      const additions = commitDetails.stats.additions;
      const deletions = commitDetails.stats.deletions;

      if (author in authorContributions) {
        authorContributions[author].additions += additions;
        authorContributions[author].deletions += deletions;
        authorContributions[author].commits += 1;
      } else {
        authorContributions[author] = {
          additions,
          deletions,
          commits: 1,
        };
      }
    }

    // Sort contributors by their number of commits
    const sortedContributors = Object.entries(authorContributions).sort(
      (a, b) => b[1].commits - a[1].commits
    );

    console.log('\nAuthor Contributions:');
    console.log('----------------------');
    const authors = Object.keys(authorContributions);
    console.log('Number of Authors:', authors.length);
    console.log('----------------------');
    for (const [author, contribution] of sortedContributors) {
      console.log('Author:', author);
      console.log('Commits:', contribution.commits);
      console.log('Additions:', contribution.additions);
      console.log('Deletions:', contribution.deletions);
      console.log('---');
    }

    return result;
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Usage example
const owner = 'ethereum';
const repo = 'EIPs';
const year = 2023;
const month = 6;

getGitHubInsightsForMonth(owner, repo, year, month)
  .then((result) => {
    // Use the result as needed
  })
  .catch((error) => {
    console.error(error);
  });
