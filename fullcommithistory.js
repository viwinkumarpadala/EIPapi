const axios = require('axios');
require('dotenv').config();
const mongoose = require('mongoose');
const EipHistory = require('./models/eiphistory');

let count=0;

const accessToken = process.env.ACCESS_TOKEN;

const base64ToText = (base64Data) => {
    const buffer = Buffer.from(base64Data, 'base64');
    return buffer.toString('utf-8');
};

const extractData = (dataString) => {
    const regex1 = /---\n([\s\S]*?)\n---/;
    const match = regex1.exec(dataString);
    if (match) {
        dataString = match[1];
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
        // console.log(fileContent);
        // console.log("metadata:");
        // console.log(metadata)
        if (Object.keys(metadata).length === 0) {
            const regex = /EIP:\s*(\d+)\nTitle:\s*(.*?)\nAuthor:\s*(.*?)\nTo:\s*(.*?)\nType:\s*(.*?)\nCategory:\s*(.*?)\nStatus:\s*(.*?)\nDeadline:\s*(.*?)\nCreated:\s*(.*?)\nRequires:\s*(.*)/i;
            const [, eip, title, author, type, category, status, created,to,deadline,requires] = regex.exec(fileContent);

            metadata = {
                eip,
                title,
                author,
                type,
                category,
                status,
                created,
                to,
                deadline,
                requires
            };
        }

        console.log('EIP:', metadata.eip || 'undefined');
        console.log('Title:', metadata.title || 'undefined');
        console.log('Author:', metadata.author || 'undefined');
        console.log('Status:', metadata.status || 'undefined');
        console.log('Type:', metadata.type || 'undefined');
        console.log('Category:', metadata.category || 'undefined');
        console.log('Created:', metadata.created || 'undefined');
        console.log('Discussions:', metadata.to || 'undefined');
        console.log('deadline:', metadata.deadline || 'undefined');
        console.log('requires:', metadata.requires || 'undefined');

        // console.log('Created At:', metadata.created.toDateString());
        const [year, month, date] = metadata.created.split("-");
        const newcreateddate = new Date(year, month - 1, date);
        console.log('created Day:', newcreateddate.getDate());
        console.log('created Month:', newcreateddate.getMonth() + 1);
        console.log('created Year:', newcreateddate.getFullYear());

        const pullRequestsURL = `${repositoryURL}/commits/${commitSha}/pulls`;
        const pullRequestsResponse = await axios.get(pullRequestsURL, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const commitinfourl = `${repositoryURL}/commits/${commitSha}`;
        const commitinfoResponse = await axios.get(commitinfourl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const commitinfoData= commitinfoResponse.data
        // console.log(commitinfoData);
        const message=commitinfoData.commit.message

        const object = commitinfoData.files[0];
        const totalchanges = object.changes 
        const totalinsertions = object.additions
        const totaldeletions = object.deletions  // Accessing the first object in the array
        // console.log(object)
        const previousDeadlineMatch = object.patch.match(/-last-call-deadline:\s(\d{4}-\d{2}-\d{2})/);
        const newDeadlineMatch = object.patch.match(/\+last-call-deadline:\s(\d{4}-\d{2}-\d{2})/);

        const previousDeadline = previousDeadlineMatch ? previousDeadlineMatch[1] : undefined;
        const newDeadline = newDeadlineMatch ? newDeadlineMatch[1] : undefined;

        console.log("Previous Deadline:", previousDeadline);
        console.log("New Deadline:", newDeadline);
        console.log("total changes:",totalchanges)
        console.log("insertions:",totalinsertions)
        console.log("deletions:",totaldeletions)
        // console.log(message)

        const pullRequestsData = pullRequestsResponse.data;
        let pullRequestData = {};

        if (pullRequestsData.length > 0) {
            const pullRequestNumber = pullRequestsData[0].number;

            const pullRequestURL = `${repositoryURL}/pulls/${pullRequestNumber}`;
            const pullRequestResponse = await axios.get(pullRequestURL, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            pullRequestData = pullRequestResponse.data;
            // console.log(pullRequestData)
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

        try {
            const existingEip = await EipHistory.findOne({ commitSha: commitSha, eip:metadata.eip });

            if (existingEip) {
                console.log('EIP with the same commit SHA already exists. Skipping...');
                return;
            }

            const eipHistory = new EipHistory({
                commitSha,
                commitDate,
                eip: metadata.eip || 'undefined',
                title: metadata.title || 'undefined',
                author: metadata.author || 'undefined',
                status: metadata.status || 'undefined',
                discussion: metadata.to || 'undefined',
                deadline: metadata.deadline || 'undefined',
                requires: metadata.requires || 'undefined',
                type: metadata.type || 'undefined',
                category: metadata.category || 'undefined',
                message: message || 'undefined',
                created: newcreateddate || 'undefined',
                mergedDate: (pullRequestData.merged ? new Date(pullRequestData.merged_at).toDateString() : commitDate.toDateString()),
                prNumber: pullRequestData.number || 0,
                closedDate: new Date(commit.commit.committer.date).toDateString(),
                mergedDay: (pullRequestData.merged ? new Date(pullRequestData.merged_at).getDate() : commitDate.getDate()),
                mergedMonth: (pullRequestData.merged ? new Date(pullRequestData.merged_at).getMonth()+1 : commitDate.getMonth()+1),
                mergedYear: (pullRequestData.merged ? new Date(pullRequestData.merged_at).getFullYear() : commitDate.getFullYear()),
                createdDate: newcreateddate.getDate() || null,
                createdMonth: newcreateddate.getMonth() + 1 || null,
                createdYear: newcreateddate.getFullYear() || null,
                changes: totalchanges || null,
                insertions: totalinsertions || null,
                deletions: totaldeletions || null,
                previousdeadline: previousDeadline || 'undefined',
                newdeadline: newDeadline || 'undefined',
            });
            

            await eipHistory.save();
            console.log(eipHistory);
            count++;
            console.log('Data saved successfully.');
            console.log("count: ",count);
        } catch (error) {
            console.error('Error saving data:', error.message);
        }
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

        const files = response.data.filter(file => file.name.endsWith('.md'));
        const filePaths = files.map(file => file.path);

        console.log('Markdown Files:');
        console.log(filePaths);
    //    const filePaths = ['EIPS/eip-6454.md']

        let requestCount = 0;

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

                    // requestCount++;
                    // if (requestCount >= 900) {
                    //     console.log('Request limit reached. Waiting for an hour...');
                    //     await new Promise((resolve) => setTimeout(resolve, 60 * 60 * 1000));
                    //     requestCount = 0;
                    // }
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

async function main() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');

        await processMarkdownFiles();

        mongoose.connection.close();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main();
