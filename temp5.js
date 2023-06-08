const axios = require('axios');
require('dotenv').config();
const accessToken = process.env.ACCESS_TOKEN;

const base64ToText = (base64Data) => {
    const buffer = Buffer.from(base64Data, 'base64');
    return buffer.toString('utf-8');
};

const extractData = (dataString) => {
    const regex = /---\n([\s\S]*?)\n---/;
    const match = regex.exec(dataString);
    if (match) {
        const metadataString = match[1];
        const metadataRegex = /(\w+):\s*(.*)/g;
        let metadata = {};
        let matchArr;

        while ((matchArr = metadataRegex.exec(metadataString)) !== null) {
            const key = matchArr[1].toLowerCase();
            const value = matchArr[2];
            metadata[key] = value;
        }

        return metadata;
    }
    return null;
};

const extractDetails = (dataString) => {
    const regex = /---\n([\s\S]*?)\n---/;
    const match = regex.exec(dataString);
    if (match) {
        const detailsString = dataString.substring(match[0].length).trim();
        return detailsString;
    }
    return null;
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

        // console.log('Commit:', commitSha);
        console.log('File Contents:');
        // console.log(fileContent);

        let metadata = extractData(fileContent);
        if (!metadata) {
            const regex = /EIP:\s*(\d+)\nTitle:\s*(.*)\nAuthor:\s*(.*)\nType:\s*(.*)\nCategory:\s*(.*)\nStatus:\s*(.*)\nCreated:\s*(.*)/i;
            const [, eip, title, author, type, category, status, created] = regex.exec(fileContent);

            metadata = {
                eip,
                title,
                author,
                type,
                category,
                status,
                created
            };
        }
        
        console.log('Metadata:');
        console.log('EIP:', metadata.eip);
        console.log('Title:', metadata.title);
        console.log('Author:', metadata.author);
        console.log('Status:', metadata.status);
        console.log('Type:', metadata.type);
        console.log('Category:', metadata.category);
        console.log('Created:', metadata.created);
        console.log("----------------------------------------------------------------------------------------");
    } catch (error) {
        console.error(`Error retrieving file contents for commit ${commitSha}:`, error.message);
    }
}

async function getFileCommitHistory() {
    try {
        const repositoryURL = 'https://api.github.com/repos/ethereum/EIPs';
        const filePath = 'EIPS/eip-100.md';
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
        if (commitHistory && commitHistory.length > 0) {
            for (const commit of commitHistory) {
                const commitSha = commit.sha;
                const commitDate = commit.commit.author.date; 
                console.log("----------------------------------------------------------------------------------------");
                console.log('Commit:', commitSha);
                console.log('Commit Date:', commitDate);
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
