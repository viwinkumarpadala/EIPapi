const axios = require('axios');
require('dotenv').config();
const accessToken = process.env.ACCESS_TOKEN;

const base64ToText = (base64Data) => {
    const buffer = Buffer.from(base64Data, 'base64');
    return buffer.toString('utf-8');
};

const extractData = (dataString) => {
    const regex = /(\w+):\s*(.*)/g;
    let metadata = {};
    let matchArr;

    while ((matchArr = regex.exec(dataString)) !== null) {
        const key = matchArr[1].toLowerCase();
        const value = matchArr[2];
        metadata[key] = value;
    }

    return metadata;
};

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
        const fileContent = base64ToText(fileData.content);

        let metadata = extractData(fileContent);
        if (Object.keys(metadata).length === 0) {
            const regex = /EIP:\s*(\d+)\nTitle:\s*(.*?)\nAuthor:\s*(.*?)\nType:\s*(.*?)\nCategory:\s*(.*?)\nStatus:\s*(.*?)\nCreated:\s*(.*)/i;
            const [, eip, title, author, type, category, status, created] = regex.exec(fileContent);

            metadata = {
                eip,
                title,
                author,
                type,
                category,
                status,
                created,
            };
        }

        console.log('EIP:', metadata.eip);
        console.log('Title:', metadata.title);
        console.log('Author:', metadata.author || 'undefined');
        console.log('Status:', metadata.status || 'undefined');
        console.log('Type:', metadata.type || 'undefined');
        console.log('Category:', metadata.category || 'undefined');
        console.log('Created:', metadata.created || 'undefined');

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
            if (pullRequestData.merged) {
                const mergedDate = new Date(pullRequestData.merged_at);
                console.log('Merged Date:', mergedDate.toDateString());
                console.log('PR Number:', pullRequestData.number);
                const closedDate = new Date(pullRequestData.closed_at);
                console.log('Closed At:', closedDate.toDateString());
                console.log('Merged Day:', mergedDate.getDate());
                console.log('Merged Month:', mergedDate.getMonth() + 1);
                console.log('Merged Year:', mergedDate.getFullYear());
            }
           
        }
        else{
            console.log('Merged Date:', '');
            console.log('PR Number:', 0);
            console.log('Closed At:', '');
            console.log('Merged Day:', 0);
            console.log('Merged Month:', 0);
            console.log('Merged Year:', 0);
        }

        console.log('----------------------------------------------------------------------------------------');
    } catch (error) {
        console.error(`Error retrieving file contents for commit ${commitSha}:`, error.message);
    }
}

async function getFileCommitHistory() {
    try {
        const repositoryURL = 'https://api.github.com/repos/ethereum/EIPs';
        const filePath = 'EIPS/eip-101.md';
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

        console.log(`Commit History for ${filePath}:`);
        if (commitHistory && commitHistory.length > 0) {
            for (const commit of commitHistory) {
                const commitSha = commit.sha;
                const commitDate = new Date(commit.commit.committer.date);

                console.log('----------------------------------------------------------------------------------------');
                console.log('Commit:', commitSha);
                console.log('Commit Date:', commitDate.toDateString());

                await getFileContents(commitSha, filePath);
            }
        } else {
            console.log('No commit history found.');
        }

        console.log('Size of Commit History:', commitHistory.length);
    } catch (error) {
        console.error('Error retrieving commit history:', error.message);
    }
}

getFileCommitHistory();
