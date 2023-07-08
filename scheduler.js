const mongoose = require('mongoose');
require('dotenv').config();
const accessToken = process.env.ACCESS_TOKEN;
const axios = require('axios');
const MdFiles = require('./models/mdfiles'); // Import the Mongoose model
const cron = require('node-cron');
const EipHistory = require('./models/eiphistory');
const StatusChange = require('./models/StatusChange');
const express=require('express')
const app=express();

const port = process.env.PORT || 3000;
app.listen(port,()=>{
    console.log(`Now listening to port ${port}!!`)
})

let count = 0;

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

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log('Connected to the database');
        scheduleJob();
    })
    .catch((error) => {
        console.log('Error connecting to the database:', error);
    });


const functioncaller = async ()=>{
    await getallinfo();
    await processMarkdownFiles();
    await fetchAndStoreEipHistory();
}

const scheduleJob = () => {
    // Schedule the job using cron syntax
    const interval = 4*60*60*1000; // 4 hours
    setInterval(async () => {
        try {
            console.log('Running getallinfo job...');
            await functioncaller();
        } catch (error) {
            console.log('Error:', error);
        }
    }, interval);
};

const getallinfo = async () => {
    try {
        const headers = {
            Authorization: `Bearer ${accessToken}`,
        };

        const response = await axios.get('https://api.github.com/repos/ethereum/EIPs/contents/EIPS', { headers });
        const allinfo = response.data;
        let count = 1;

        for (const obj of allinfo) {
            const url = obj.url;
            const result = await axios.get(url, { headers });
            const resultContent = base64ToText(result.data.content);

            let extractedData = extractData(resultContent);
            if (Object.keys(extractedData).length === 0) {
                const regex = /EIP:\s*(\d+)\nTitle:\s*(.*?)\nAuthor:\s*(.*?)\nTo:\s*(.*?)\nType:\s*(.*?)\nCategory:\s*(.*?)\nStatus:\s*(.*?)\nDeadline:\s*(.*?)\nCreated:\s*(.*?)\nRequires:\s*(.*)/i;
                const [, eip, title, author, type, category, status, created, to, deadline, requires] = regex.exec(resultContent);

                extractedData = {
                    eip,
                    title,
                    author,
                    type,
                    category,
                    status,
                    created,
                    to,
                    deadline,
                    requires,
                };
            }

            const [year, month, date] = extractedData.created.split("-");
            const newcreateddate = new Date(year, month - 1, date);

            try {
                const newMdFile = new MdFiles({
                    eip: extractedData.eip || '',
                    title: extractedData.title || '',
                    author: extractedData.author || '',
                    status: extractedData.status || '',
                    type: extractedData.type || '',
                    category: extractedData.category || '',
                    created: newcreateddate || 'undefined',
                    requires: extractedData.requires || '',
                    discussion: extractedData.to || '',
                    deadline: extractedData.deadline || '',
                    unique_ID: count || null,
                });

                console.log(newMdFile);
                await newMdFile.save();
                count++;
                console.log('Data saved successfully.');
                console.log('Count:', count);
            } catch (error) {
                // Handle duplicate key error if eip already exists
                if (error.code === 11000) {
                    console.log(`Skipping duplicate EIP: ${extractedData.eip}`);
                } else {
                    console.log('Error:', error);
                }
            }
        }
    } catch (error) {
        console.log('Error:', error);
    } finally {
        console.log('getallinfo job completed');
    }
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
            const [, eip, title, author, type, category, status, created, to, deadline, requires] = regex.exec(fileContent);

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

        const existingEip2 = await EipHistory.findOne({ commitSha: commitSha, eip: metadata.eip });

        if (existingEip2) {
            console.log('EIP with the same commit SHA already exists. Skipping...');
            return;
        }

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

        const commitinfoData = commitinfoResponse.data
        // console.log(commitinfoData);
        const message = commitinfoData.commit.message

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
        console.log("total changes:", totalchanges)
        console.log("insertions:", totalinsertions)
        console.log("deletions:", totaldeletions)
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
            const existingEip = await EipHistory.findOne({ commitSha: commitSha, eip: metadata.eip });

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
                mergedMonth: (pullRequestData.merged ? new Date(pullRequestData.merged_at).getMonth() + 1 : commitDate.getMonth() + 1),
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
            console.log("count: ", count);
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




async function fetchAndStoreEipHistory() {
    try {
        // Connect to the MongoDB database
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to the database');

        const uniqueEipNumbers = await MdFiles.distinct('eip');
        // console.log(uniqueEipNumbers);

        // Iterate over each EIP number
        for (const eipNumber of uniqueEipNumbers) {
            const commitHistory = await EipHistory.find({ eip: eipNumber });

            commitHistory.sort((a, b) => new Date(a.mergedDate) - new Date(b.mergedDate));

            // Get the status change history
            const statusChangeHistory = getStatusChangeHistory(commitHistory);

            // Store the status change history in the database
            for (const statusChange of statusChangeHistory) {
                const existingStatusChange = await StatusChange.findOne({
                    eip: statusChange.eip,
                    fromStatus: statusChange.fromStatus,
                    toStatus: statusChange.toStatus,
                    changeDate: statusChange.changeDate
                });

                if (!existingStatusChange) {
                    await StatusChange.create(statusChange);
                    console.log('Status change saved:', statusChange);
                } else {
                    console.log('Status change already exists. Skipping:', statusChange);
                }
            }
        }

        console.log('EIP history stored successfully');
    } catch (error) {
        console.error('Error:', error.message);
    }
}

function getStatusChangeHistory(commitHistory) {
    const statusChangeHistory = [];
    commitHistory.sort((a, b) => new Date(a.mergedDate) - new Date(b.mergedDate));
    // console.log(commitHistory);

    for (let i = 0; i < commitHistory.length - 1; i++) {
        const currentCommit = commitHistory[i + 1];
        const previousCommit = commitHistory[i];

        const changeDate = new Date(currentCommit.mergedDate);
        changeDate.setDate(changeDate.getDate() - 1);

        if (currentCommit.status !== previousCommit.status) {
            const statusChange = {
                eip: previousCommit.eip,
                title: previousCommit.title,
                author: previousCommit.author,
                created: currentCommit.created,
                fromStatus: previousCommit.status,
                toStatus: currentCommit.status,
                status: currentCommit.status,
                changeDate: changeDate,
                discussion: currentCommit.discussion,
                deadline: currentCommit.deadline,
                requires: currentCommit.requires,
                category: currentCommit.category == 'undefined' ? currentCommit.type : currentCommit.category,
                type: currentCommit.type,
                pr: currentCommit.prNumber,
                createdMonth: currentCommit.createdMonth,
                createdYear: currentCommit.createdYear,
                changedYear: changeDate.getFullYear(),
                changedMonth: changeDate.getMonth() + 1,
                changedDay: changeDate.getDate(),
            };

            statusChangeHistory.unshift(statusChange);
        }

        if (
            currentCommit.previousdeadline !== 'undefined' &&
            currentCommit.newdeadline !== 'undefined' && currentCommit.previousdeadline !== currentCommit.newdeadline
        ) {
            const statusChange = {
                eip: currentCommit.eip,
                title: currentCommit.title,
                author: currentCommit.author,
                created: currentCommit.created,
                fromStatus: 'Last Call',
                toStatus: 'Last Call',
                status: currentCommit.status,
                changeDate: changeDate,
                discussion: currentCommit.discussion,
                deadline: currentCommit.deadline,
                requires: currentCommit.requires,
                category: currentCommit.category == 'undefined' ? currentCommit.type : currentCommit.category,
                type: currentCommit.type,
                pr: currentCommit.prNumber,
                createdMonth: currentCommit.createdMonth,
                createdYear: currentCommit.createdYear,
                changedYear: changeDate.getFullYear(),
                changedMonth: changeDate.getMonth() + 1,
                changedDay: changeDate.getDate(),
            };

            statusChangeHistory.unshift(statusChange);
        }
        if (
            i == 0
        ) {
            const statusChange = {
                eip: previousCommit.eip,
                title: previousCommit.title,
                author: previousCommit.author,
                created: previousCommit.created,
                fromStatus: 'unknown',
                toStatus: previousCommit.status,
                status: previousCommit.status,
                changeDate: changeDate,
                discussion: previousCommit.discussion,
                deadline: previousCommit.deadline,
                requires: previousCommit.requires,
                category: (previousCommit.category == 'undefined' ? previousCommit.type : previousCommit.category),
                type: previousCommit.type,
                pr: previousCommit.prNumber,
                createdMonth: previousCommit.createdMonth,
                createdYear: previousCommit.createdYear,
                changedYear: changeDate.getFullYear(),
                changedMonth: changeDate.getMonth() + 1,
                changedDay: changeDate.getDate(),
            };

            statusChangeHistory.unshift(statusChange);
        }
    }

    if (commitHistory.length === 1) {
        const currentCommit = commitHistory[0];
        const changeDate = new Date(currentCommit.mergedDate);
        changeDate.setDate(changeDate.getDate() - 1);
        const statusChange = {
            eip: currentCommit.eip,
            title: currentCommit.title,
            author: currentCommit.author,
            created: currentCommit.created,
            fromStatus: 'unknown',
            toStatus: currentCommit.status,
            status: currentCommit.status,
            changeDate: changeDate,
            discussion: currentCommit.discussion,
            deadline: currentCommit.deadline,
            requires: currentCommit.requires,
            category: (currentCommit.category == 'undefined' ? currentCommit.type : currentCommit.category),
            type: currentCommit.type,
            pr: currentCommit.prNumber,
            createdMonth: currentCommit.createdMonth,
            createdYear: currentCommit.createdYear,
            changedYear: changeDate.getFullYear(),
            changedMonth: changeDate.getMonth() + 1,
            changedDay: changeDate.getDate(),
        };

        statusChangeHistory.unshift(statusChange);
    }

    //   for (let i = commitHistory.length - 1; i > 0; i--) {
    const currentCommit = commitHistory[0];

    if (currentCommit.status === 'Draft') {
        const changeDate = new Date(currentCommit.mergedDate);
        changeDate.setDate(changeDate.getDate() - 1);
        const statusChange = {
            eip: currentCommit.eip,
            title: currentCommit.title,
            author: currentCommit.author,
            created: currentCommit.created,
            fromStatus: 'unknown',
            toStatus: currentCommit.status,
            status: currentCommit.status,
            changeDate: changeDate,
            discussion: currentCommit.discussion,
            deadline: currentCommit.deadline,
            requires: currentCommit.requires,
            category: (currentCommit.category == 'undefined' ? currentCommit.type : currentCommit.category),
            type: currentCommit.type,
            pr: currentCommit.prNumber,
            createdMonth: currentCommit.createdMonth,
            createdYear: currentCommit.createdYear,
            changedYear: changeDate.getFullYear(),
            changedMonth: changeDate.getMonth() + 1,
            changedDay: changeDate.getDate(),
        };

        statusChangeHistory.unshift(statusChange);
        // }
    }

    return statusChangeHistory;
}

app.get('/',(req,res)=>{
    res.send("The server is running fine")
})