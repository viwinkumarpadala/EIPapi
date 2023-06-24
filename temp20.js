const axios = require('axios');
require('dotenv').config();
const repositoryURL = 'https://api.github.com/repos/ethereum/EIPs';
// const accessToken = 'YOUR_GITHUB_ACCESS_TOKEN';
const accessToken = process.env.ACCESS_TOKEN;
const filePath = 'EIPS/eip-3076.md';

// const axios = require('axios');

// const repositoryURL = 'https://api.github.com/repos/ethereum/EIPs';
// const accessToken = 'YOUR_GITHUB_ACCESS_TOKEN';
// const filePath = 'path/to/your/file.md';

async function getUnmergedPRs() {
    try {
        // Fetch the commit history for the file
        const response = await axios.get(`${repositoryURL}/commits`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            params: {
                path: filePath,
            },
        });

        // Extract the pull request numbers associated with the commits
        const commitShaList = response.data.map((commit) => commit.sha);
        const unmergedPRs = [];

        for (const commitSha of commitShaList) {
            const pullRequestsURL = `${repositoryURL}/commits/${commitSha}/pulls`;
            const pullRequestsResponse = await axios.get(pullRequestsURL, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            const pullRequestsData = pullRequestsResponse.data;



            if (pullRequestsData.length > 0) {
                const pullRequestNumber = pullRequestsData[0].number;

                const pullRequestURL = `${repositoryURL}/pulls/${pullRequestNumber}`;
                const pullRequestResponse = await axios.get(pullRequestURL, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                const pullRequestData = pullRequestResponse.data;

                console.log(pullRequestData)

                if (!pullRequestData.merged) {
                    unmergedPRs.push(pullRequestData);
                }
            }
        }

        console.log('Unmerged PRs:', unmergedPRs);
    } catch (error) {
        console.error('Error retrieving unmerged PRs:', error.message);
    }
}

getUnmergedPRs();
