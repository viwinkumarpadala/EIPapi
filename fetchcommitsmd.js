const axios = require('axios');
require('dotenv').config();
const accessToken = process.env.ACCESS_TOKEN;


async function getFileCommitHistory() {
    try {
        const repositoryURL = 'https://api.github.com/repos/ethereum/EIPs';
        const filePath = 'EIPS/eip-6454.md';
        const commitsURL = `${repositoryURL}/commits`;
        
        const response = await axios.get(commitsURL, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            },
            params: {
                path: filePath,
                per_page: 100, 
                page: 1
            }
        });

        const commitHistory = response.data;

        console.log('Commit History for eip-100.md:');
        commitHistory.forEach(commit => {
            console.log('Commit:', JSON.stringify(commit, null, 2));
        });

        console.log('Size of Commit History:', commitHistory.length);
    } catch (error) {
        console.error('Error retrieving commit history:', error.message);
    }
}

getFileCommitHistory();
