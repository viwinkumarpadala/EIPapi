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
        console.log('Access Token:', accessToken);

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
        // console.log(commits);

        // Process each commit
        for (const commit of commits) {
            const commitMessage = commit.commit.message;
            const pullRequestUrl = commit.url;
            console.log("commit message:",commitMessage);
            console.log("pr url:",pullRequestUrl)

            // Retrieve pull request number of that commit
            let pullRequestNumber = null;
            if (commitMessage.includes('Merge pull request')) {
                const regex = /Merge pull request #(\d+)/;
                const match = commitMessage.match(regex);
                if (match && match.length > 1) {
                    pullRequestNumber = match[1];
                    console.log(pullRequestUrl);
                }
            }
            console.log("pr number:",pullRequestNumber);
            console.log("pr url2:",pullRequestUrl);
            // Fetch files changed
            const filesUrl = `${apiUrl}/repos/${owner}/${repo}/commits/${commit.sha}/files`;
            const filesResponse = await axios.get(filesUrl, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            const files = filesResponse.data;
            console.log(files)

            for (const file of files) {
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
