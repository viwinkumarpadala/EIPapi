const axios = require('axios');
require('dotenv').config();
const accessToken = process.env.ACCESS_TOKEN;

async function getFileContents(commitSha, filePath) {
    try {
        const repositoryURL = 'https://api.github.com/repos/ethereum/EIPs';
        const fileURL = `${repositoryURL}/contents/${filePath}`;

        const response = await axios.get(fileURL, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            params: {
                ref: commitSha,
            },
        });

        const fileData = response.data;
        const fileContent = Buffer.from(fileData.content, 'base64').toString('utf-8');

        console.log('Commit:', commitSha);
        console.log('File Contents:');
        const regex = /EIP:\s*(\d+)\nTitle:\s*(.*)\nAuthor:\s*(.*)\nType:\s*(.*)\nCategory:\s*(.*)\nStatus:\s*(.*)\nCreated:\s*(.*)/i;
        const [, eip, title, author, type, category, status, created] = regex.exec(fileContent);

        console.log('Commit:', commitSha);
        console.log('EIP:', eip);
        console.log('Title:', title);
        console.log('Author:', author);
        console.log('Type:', type);
        console.log('Category:', category);
        console.log('Status:', status);
        console.log('Created:', created);
        // console.log(fileContent);
    } catch (error) {
        console.error(`Error retrieving file contents for commit ${commitSha}:`, error.message);
    }
}

async function getFileCommitHistory() {
    try {
        const repositoryURL = 'https://api.github.com/repos/ethereum/EIPs';
        const filePath = 'EIPS/eip-1.md';
        const commitsURL = `${repositoryURL}/commits`;

        const response = await axios.get(commitsURL, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            params: {
                path: filePath,
                per_page: 10,
                page: 1,
            },
        });

        const commitHistory = response.data;

        console.log('Commit History for eip-100.md:');
        for (const commit of commitHistory) {
            await getFileContents(commit.sha, filePath);
        }

        console.log('Size of Commit History:', commitHistory.length);
    } catch (error) {
        console.error('Error retrieving commit history:', error.message);
    }
}

getFileCommitHistory();