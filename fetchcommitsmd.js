const axios = require('axios');

async function getFileCommitHistory() {
    try {
        const repositoryURL = 'https://api.github.com/repos/ethereum/EIPs';
        const filePath = 'EIPS/eip-1.md';
        const commitsURL = `${repositoryURL}/commits`;
        const accessToken = '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'; 

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
