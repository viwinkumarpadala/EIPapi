const axios = require('axios');
require('dotenv').config();

const accessToken = process.env.ACCESS_TOKEN;

async function getCommitsAndPullRequests(owner, repo, path, month, year) {
    const apiUrl = 'https://api.github.com';

    // Format month and year to GitHub desired format
    const formattedMonth = month.toString().padStart(2, '0');
    const formattedYear = year.toString();

    try {
        // Get commits during the specified month
        const commitsUrl = `${apiUrl}/repos/${owner}/${repo}/commits`;
        const commitsResponse = await axios.get(commitsUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json'
            },
            params: {
                path: path,
                since: `${formattedYear}-${formattedMonth}-01T00:00:00Z`,
                until: `${formattedYear}-${formattedMonth}-31T23:59:59Z`
            }
        });
        const commits = commitsResponse.data;
        // console.log(commits[0]);

        // Process each commit
        for (const commit of commits) {
            const commitMessage = commit.commit.message;
            const pullRequestUrl = commit.url;

            // Retrieve pull request number of that commit
            // console.log(commitMessage)
            // console.log("pr url:", pullRequestUrl)
            let pullRequestNumber = null;
            if (commitMessage.includes('Merge pull request')) {
                console.log("hello");
                const regex = /Merge pull request #(\d+)/;
                const match = commitMessage.match(regex);
                if (match && match.length > 1) {
                    pullRequestNumber = match[1];
                    console.log(pullRequestUrl);
                }
            }

            // Fetch files changed
            const commitFilesUrl = `${apiUrl}/repos/${owner}/${repo}/commits/${commit.sha}`;
            // console.log(commitFilesUrl)
            const commitFilesResponse = await axios.get(commitFilesUrl, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            const commitFiles = commitFilesResponse.data.files;

            for (const file of commitFiles) {
                const filename = file.filename;
                const additions = file.additions;
                const deletions = file.deletions;
                const changes = file.changes;

                console.log(`File: ${filename}`);
                console.log(`Additions: ${additions}`);
                console.log(`Deletions: ${deletions}`);
                console.log(`Changes: ${changes}`);
            }
        }
    } catch (error) {
        if (error.response && error.response.status === 422) {
            console.error('Error: Unprocessable Entity');
            console.error('Make sure the path, month, and year are correct.');
        } else {
            console.error('Error:', error.message);
        }
    }
}

const owner = 'ethereum';
const repo = 'EIPs';
const path = 'EIPS';
const month = 6; // June
const year = 2023;

getCommitsAndPullRequests(owner, repo, path, month, year);
