const axios = require('axios');
require('dotenv').config();
const accessToken = process.env.ACCESS_TOKEN;

const base64ToText = (base64Data) => {
    const buffer = Buffer.from(base64Data, 'base64');
    return buffer.toString('utf-8');
};

const extractData = (dataString) => {
    const regex1 = /---\n([\s\S]*?)\n---/;
    const match = regex1.exec(dataString);
    if(match){
        dataString=match[1];
    }
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

async function getFileContents(commit, filePath) {
    try {
        const commitSha = commit.sha;
        const commitDate = new Date(commit.commit.committer.date);

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

        console.log('EIP:', metadata.eip || 'undefined');
        console.log('Title:', metadata.title || 'undefined');
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
                const closedDate = pullRequestData.closed_at ? new Date(pullRequestData.closed_at) : new Date(commit.committer.date);
                console.log('Closed At:', closedDate.toDateString());
                console.log('Merged Day:', mergedDate.getDate());
                console.log('Merged Month:', mergedDate.getMonth() + 1);
                console.log('Merged Year:', mergedDate.getFullYear());
            }
        } else {
            const mergedDate = new Date(commit.commit.committer.date);
            console.log('Merged Date:', mergedDate.toDateString());
            console.log('PR Number:', 0);
            const closedDate = new Date(commit.commit.committer.date);
            console.log('Closed At:', closedDate.toDateString());
            console.log('Merged Day:', mergedDate.getDate());
            console.log('Merged Month:', mergedDate.getMonth() + 1);
            console.log('Merged Year:', mergedDate.getFullYear());
        }

        console.log('----------------------------------------------------------------------------------------');
    } catch (error) {
        console.error(`Error retrieving file contents for commit ${commit.sha}:`, error.message);
    }
}

async function processMarkdownFiles() {
    try {
        const repositoryURL = 'https://api.github.com/repos/ethereum/EIPs';

        const contentsURL = `${repositoryURL}/contents/EIPS`;

        const response = await axios.get(contentsURL, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            params: {
                per_page: 1000,
            },
        });

        // requestCount++;

        const files = response.data.filter(file => file.name.endsWith('.md'));
        // const filePaths = files.map(file => file.path);

        console.log('Markdown Files:');
        // console.log(filePaths);
        const filePaths = ['EIPS/eip-100.md', 'EIPS/eip-1.md', 'EIPS/eip-1010.md'];

        let requestCount = 0; // Track the number of requests made

        for (const filePath of filePaths) {
            console.log('----------------------------------------------------------------------------------------');
            console.log(`Processing ${filePath}`);

            const commitsURL = `${repositoryURL}/commits`;
            const response = await axios.get(commitsURL, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                params: {
                    path: filePath,
                    per_page: 100,
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

                    await getFileContents(commit, filePath);

                    requestCount++;
                    if (requestCount >= 900) {
                        // If the request count exceeds the limit, wait for an hour
                        console.log('Request limit reached. Waiting for an hour...');
                        await new Promise((resolve) => setTimeout(resolve, 60 * 60 * 1000));
                        requestCount = 0; // Reset the request count after the hour wait
                    }
                }
            } else {
                console.log('No commit history found.');
            }

            console.log('Size of Commit History:', commitHistory.length);
        }
    } catch (error) {
        console.error('Error processing markdown files:', error.message);
    }
}

processMarkdownFiles();
