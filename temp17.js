const axios = require('axios');
require('dotenv').config();

async function getCommitInfo(owner, repo, startDate, endDate, accessToken) {
    try {
        const searchQuery = `repo:${owner}/${repo} committer-date:${startDate}..${endDate}`;
        const headers = { Authorization: `Bearer ${accessToken}` };
        const response = await axios.get(`https://api.github.com/search/commits?q=${encodeURIComponent(searchQuery)}`, { headers });
        const commits = response.data.items;

        let totalInsertions = 0;
        let totalDeletions = 0;
        const authorStats = {};

        for (const commit of commits) {
            const commitResponse = await axios.get(commit.url, { headers });
            const commitData = commitResponse.data;

            const { login } = commitData.committer;
            const { additions, deletions } = commitData.stats;

            totalInsertions += additions;
            totalDeletions += deletions;

            if (login in authorStats) {
                authorStats[login] += 1;
            } else {
                authorStats[login] = 1;
            }
        }

        const commitCount = commits.length;

        console.log('Commit Information:');
        console.log('----------------------');
        console.log('Commits:', commitCount);
        console.log('Authors:');
        console.log(authorStats);
        console.log('Insertions:', totalInsertions);
        console.log('Deletions:', totalDeletions);

        return { commits: commitCount, authors: authorStats, insertions: totalInsertions, deletions: totalDeletions };
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Usage example
const owner = 'ethereum';
const repo = 'EIPs';
const startDate = '2023-06-03';
const endDate = '2023-06-10';
const accessToken = process.env.ACCESS_TOKEN;

getCommitInfo(owner, repo, startDate, endDate, accessToken)
    .then((result) => {
        // Use the result as needed
    })
    .catch((error) => {
        console.error(error);
    });
