const axios = require('axios');

async function getCommitHistory() {
    try {
        const repositoryURL = 'https://api.github.com/repos/ethereum/EIPs';
        const commitsURL = `${repositoryURL}/commits`;
        const accessToken = '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'; // Replace with your access token

        const perPage = 100; 
        let allCommits = [];
        let page = 1;
        let response;

        do {
            response = await axios.get(commitsURL, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                },
                params: {
                    per_page: perPage,
                    page: page,
                    sha: 'master' 
                }
            });

            const commits = response.data;
            allCommits.push(...commits);

            page++;
        } while (response.data.length === perPage && allCommits.length < 500);

        
        console.log('Commit History:');
        console.log(allCommits);

        console.log('Size of Commit History:', allCommits.length);
    } catch (error) {
        console.error('Error retrieving commit history:', error.message);
    }
}

getCommitHistory();
