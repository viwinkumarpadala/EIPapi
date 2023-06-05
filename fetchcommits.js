const axios = require('axios');
require('dotenv').config();

const accessToken = process.env.ACCESS_TOKEN;


async function getCommitHistory() {
    try {
        const repositoryURL = 'https://api.github.com/repos/ethereum/EIPs';
        const commitsURL = `${repositoryURL}/commits`;
       

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
        console.log(allCommits[0]);

        console.log('Size of Commit History:', allCommits.length);
    } catch (error) {
        console.error('Error retrieving commit history:', error.message);
    }
}

getCommitHistory();
