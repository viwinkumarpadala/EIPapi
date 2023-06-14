require('dotenv').config();
const { Octokit } = require('@octokit/rest');

async function getGitHubStatsForMonth(owner, repo, year, month) {
    const octokit = new Octokit({ auth: process.env.ACCESS_TOKEN });

    const startDate = new Date('2023-06-03');
    const endDate = new Date('2023-06-10');
    const startISODate = startDate.toISOString();
    const endISODate = endDate.toISOString();

    try {
        const { data: commits } = await octokit.repos.listCommits({
            owner,
            repo,
            per_page: 1000,
            since: startISODate,
            until: endISODate,
        });

        const { data: pulses } = await octokit.activity.listRepoEvents({
            owner,
            repo,
            per_page: 1000,
            page: 1,
        });

        const authors = {};
        let insertions = 0;
        let deletions = 0;

        for (const commit of commits) {
            const { data: commitDetails } = await octokit.repos.getCommit({
                owner,
                repo,
                ref: commit.sha,
            });

            const author = commitDetails.commit.author.name;
            authors[author] = authors[author] ? authors[author] + 1 : 1;
            console.log(commitDetails.stats)
            insertions += commitDetails.stats.additions;
            deletions += commitDetails.stats.deletions;
            // console.log(insertions);
            // console.log(deletions)
        }

        const result = {
            commits: commits.length,
            authors,
            insertions,
            deletions,
            pulses: pulses.length,
        };

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

getGitHubStatsForMonth(owner, repo, year, month)
    .then((result) => {
        console.log(result);
    })
    .catch((error) => {
        console.error(error);
    });
