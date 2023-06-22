const express = require("express");
const app = express();
const port = 5000;
const axios = require('axios');
const cheerio = require('cheerio');
const { Octokit } = require('@octokit/rest');
const mongoose = require('mongoose');
const MdFiles = require('./models/mdfiles');
const EipHistory=require('./models/eiphistory')
const StatusChange = require('./models/StatusChange');
require('dotenv').config();
const accessToken = process.env.ACCESS_TOKEN;

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log('Connected to the database');
    })
    .catch((error) => {
        console.error('Error connecting to the database:', error.message);
    });


app.listen(port, () => {
    console.log(`Listening on port ${port}!!`);
});

// Route to extract information from the URL
app.get("/pulse-daily", async (req, res) => {
    try {
        const url = 'https://github.com/ethereum/EIPs/pulse_diffstat_summary?period=daily';
        const response = await axios.get(url);
        const html = response.data;

        // Load the HTML using Cheerio
        const $ = cheerio.load(html);

        // Extract the desired information
        const infoContainer = $('div.color-fg-muted');
        const numAuthors = infoContainer.find('strong.color-fg-default').eq(0).text().trim();
        const commitsToMaster = infoContainer.find('strong.color-fg-default span.text-emphasized').eq(0).text().trim();
        const commitsToAllBranches = infoContainer.find('strong.color-fg-default span.text-emphasized').eq(1).text().trim();
        const filesChanged = infoContainer.find('strong.color-fg-default').eq(1).text().trim();
        const additions = infoContainer.find('strong.color-fg-success').text().trim();
        const deletions = infoContainer.find('strong.color-fg-danger').text().trim();

        const info = {
            numAuthors: parseInt(numAuthors),
            commitsToMaster: parseInt(commitsToMaster),
            commitsToAllBranches: parseInt(commitsToAllBranches),
            filesChanged: parseInt(filesChanged),
            additions: parseInt(additions),
            deletions: parseInt(deletions)
        };

        res.json(info);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get("/pulse-lastmonth", async (req, res) => {
    try {
        const url = 'https://github.com/ethereum/EIPs/pulse_diffstat_summary?period=month';
        const response = await axios.get(url);
        const html = response.data;

        // Load the HTML using Cheerio
        const $ = cheerio.load(html);

        // Extract the desired information
        const infoContainer = $('div.color-fg-muted');
        const numAuthors = infoContainer.find('strong.color-fg-default').eq(0).text().trim();
        const commitsToMaster = infoContainer.find('strong.color-fg-default span.text-emphasized').eq(0).text().trim();
        const commitsToAllBranches = infoContainer.find('strong.color-fg-default span.text-emphasized').eq(1).text().trim();
        const filesChanged = infoContainer.find('strong.color-fg-default').eq(1).text().trim();
        const additions = infoContainer.find('strong.color-fg-success').text().trim();
        const deletions = infoContainer.find('strong.color-fg-danger').text().trim();

        const info = {
            numAuthors: parseInt(numAuthors),
            commitsToMaster: parseInt(commitsToMaster),
            commitsToAllBranches: parseInt(commitsToAllBranches),
            filesChanged: parseInt(filesChanged),
            additions: parseInt(additions),
            deletions: parseInt(deletions)
        };

        res.json(info);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get("/pulse-lastweek", async (req, res) => {
    try {
        const url = 'https://github.com/ethereum/EIPs/pulse_diffstat_summary?period=week';
        const response = await axios.get(url);
        const html = response.data;

        // Load the HTML using Cheerio
        const $ = cheerio.load(html);

        // Extract the desired information
        const infoContainer = $('div.color-fg-muted');
        const numAuthors = infoContainer.find('strong.color-fg-default').eq(0).text().trim();
        const commitsToMaster = infoContainer.find('strong.color-fg-default span.text-emphasized').eq(0).text().trim();
        const commitsToAllBranches = infoContainer.find('strong.color-fg-default span.text-emphasized').eq(1).text().trim();
        const filesChanged = infoContainer.find('strong.color-fg-default').eq(1).text().trim();
        const additions = infoContainer.find('strong.color-fg-success').text().trim();
        const deletions = infoContainer.find('strong.color-fg-danger').text().trim();

        const info = {
            numAuthors: parseInt(numAuthors),
            commitsToMaster: parseInt(commitsToMaster),
            commitsToAllBranches: parseInt(commitsToAllBranches),
            filesChanged: parseInt(filesChanged),
            additions: parseInt(additions),
            deletions: parseInt(deletions)
        };

        res.json(info);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});


app.get("/monthly-insights/:year/:month", async (req, res) => {
    try {
        const owner = 'ethereum';
        const repo = 'EIPs';
        const year = parseInt(req.params.year);
        const month = parseInt(req.params.month);

        const result = await getGitHubInsightsForMonth(owner, repo, year, month);
        console.log(result)
        res.json(result);
    } catch (error) {
        console.error('Error:', error.message); 
        res.status(500).json({ error: 'Internal server error' });
    }
});

async function getGitHubInsightsForMonth(owner, repo, year, month) {
    const octokit = new Octokit({ auth: process.env.ACCESS_TOKEN });

    try {
        // Get the start and end dates of the month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        const startISODate = startDate.toISOString();
        const endISODate = endDate.toISOString();

        // Rest of the code...

        let page = 1;
        let mergedPRsThisMonth = [];

        while (true) {
            const { data: mergedPRs } = await octokit.pulls.list({
                owner,
                repo,
                state: 'closed',
                sort: 'created',
                direction: 'desc',
                per_page: 100,
                page,
            });

            const prsInDateRange = mergedPRs.filter(
                (pr) =>
                    pr.merged_at &&
                    new Date(pr.merged_at) >= startDate &&
                    new Date(pr.merged_at) <= endDate
            );

            mergedPRsThisMonth = mergedPRsThisMonth.concat(prsInDateRange);

            if (prsInDateRange.length < 100) {
                break;
            }

            page++;
        }

        // Print the titles of merged PRs
        console.log('\nMerged PR Titles:');
        console.log('------------------');
        for (const pr of mergedPRsThisMonth) {
            console.log(pr.title);
        }

        // Get the open pull requests
        const { data: openPRs } = await octokit.pulls.list({
            owner,
            repo,
            state: 'open',
            per_page: 100,
            page: 1,
        });

        const openPRsThisMonth = openPRs.filter(
            (pr) => new Date(pr.created_at) >= startDate && new Date(pr.created_at) <= endDate
        );

        // Print the titles of open PRs
        console.log('\nOpen PR Titles:');
        console.log('----------------');
        for (const pr of openPRsThisMonth) {
            console.log(pr.title);
        }

        // Get the closed issues
        const { data: closedIssues } = await octokit.issues.listForRepo({
            owner,
            repo,
            state: 'closed',
            sort: 'created',
            direction: 'desc',
            per_page: 100,
            page: 1,
        });

        const closedIssuesThisMonth = closedIssues.filter(
            (issue) =>
                new Date(issue.closed_at) >= startDate && new Date(issue.closed_at) <= endDate
        );

        // Get the new issues
        const { data: newIssues } = await octokit.issues.listForRepo({
            owner,
            repo,
            state: 'open',
            sort: 'created',
            direction: 'asc',
            per_page: 100,
            page: 1,
        });

        const newIssuesThisMonth = newIssues.filter(
            (issue) => new Date(issue.created_at) >= startDate && new Date(issue.created_at) <= endDate
        );

        // Get the commits to master branch
        const { data: commitsToMaster } = await octokit.repos.listCommits({
            owner,
            repo,
            sha: 'master',
            since: startISODate,
            until: endISODate,
            per_page: 100,
            page: 1,
        });

        // Get the commits to all branches
        const { data: commitsToAllBranches } = await octokit.repos.listCommits({
            owner,
            repo,
            since: startISODate,
            until: endISODate,
            per_page: 100,
            page: 1,
        });

        // Get the contributors
        const { data: contributors } = await octokit.repos.listContributors({
            owner,
            repo,
            per_page: 100,
            page: 1,
        });

        // Get the number of files changed, insertions, and deletions
        let filesChanged = 0;
        let insertions = 0;
        let deletions = 0;

        for (const commit of commitsToAllBranches) {
            const { data: commitDetails } = await octokit.repos.getCommit({
                owner,
                repo,
                ref: commit.sha,
            });

            filesChanged += commitDetails.files.length;
            insertions += commitDetails.stats.additions;
            deletions += commitDetails.stats.deletions;
        }

        // Return the insights as an object
        const insights = {
            mergedPRs: mergedPRsThisMonth.length,
            openPRs: openPRsThisMonth.length,
            closedIssues: closedIssuesThisMonth.length,
            newIssues: newIssuesThisMonth.length,
            commitsToMaster: commitsToMaster.length,
            commitsToAllBranches: commitsToAllBranches.length,
            contributors: contributors.length,
            filesChanged,
            insertions,
            deletions,
        };

        return insights;
    } catch (error) {
        console.error('Error:', error.message);
        throw error;
    }
}


app.get('/alleips', (req, res) => {
    MdFiles.aggregate([
        {
            $group: {
                _id: '$status',
                eips: { $push: '$$ROOT' }
            }
        }
    ])
        .then((result) => {
            const formattedResult = result.map((group) => ({
                status: group._id,
                count: group.eips.length,
                eips: group.eips
            }));
            res.json(formattedResult);
        })
        .catch((error) => {
            console.error('Error retrieving EIPs:', error.message);
            res.status(500).json({ error: 'Internal server error' });
        });
});


// Route to get a specific EIP by its number
app.get('/eips/:number', (req, res) => {
    const eipNumber = req.params.number;

    MdFiles.findOne({ eip: eipNumber })
        .then((eip) => {
            if (eip) {
                res.json(eip);
            } else {
                res.status(404).json({ error: 'EIP not found' });
            }
        })
        .catch((error) => {
            console.error('Error retrieving EIP:', error.message);
            res.status(500).json({ error: 'Internal server error' });
        });
});


app.get('/eip-commithistory/:eipNumber', async (req, res) => {
    try {
        const eipNumber = req.params.eipNumber;
        const eipHistory = await EipHistory.find({ eip: eipNumber });

        if (!eipHistory) {
            return res.status(404).json({ error: 'EIP history not found' });
        }

        res.json(eipHistory);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/pr/:prNumber', async (req, res) => {
    try {
        const prNumber = req.params.prNumber;
        const accessToken = process.env.ACCESS_TOKEN; // Replace with your actual access token

        const prResponse = await axios.get(`https://api.github.com/repos/ethereum/EIPs/pulls/${prNumber}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const prData = prResponse.data;

        const prDetails = {
            title: prData.title,
            description: prData.body,
            labels: prData.labels.map(label => label.name),
            conversations: [],
            participants: [],
            commits: [],
            filesChanged: [],
            mergeDate: prData.merged_at
        };

        const requestor = prData.user.login;
        prDetails.participants.push(requestor);

        let page = 1;
        let allConversations = [];

        while (true) {
            const conversationResponse = await axios.get(`https://api.github.com/repos/ethereum/EIPs/issues/${prNumber}/comments`, {
                params: {
                    page,
                    per_page: 100,
                },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            const conversations = conversationResponse.data;
            allConversations = allConversations.concat(conversations);

            if (conversations.length < 100) {
                break;
            }

            page++;
        }

        const reviewCommentsResponse = await axios.get(`https://api.github.com/repos/ethereum/EIPs/pulls/${prNumber}/comments`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const reviewComments = reviewCommentsResponse.data;
        allConversations = allConversations.concat(reviewComments);

        prDetails.conversations = allConversations.map(conversation => ({
            user: conversation.user.login,
            body: conversation.body
        }));

        const participants = new Set(
            allConversations
                .filter(conversation => conversation.user.login !== 'github-actions[bot]')
                .map(conversation => conversation.user.login)
        );

        const commentParticipants = new Set(
            reviewComments
                .filter(comment => comment.user.login !== 'github-actions[bot]')
                .map(comment => comment.user.login)
        );

        commentParticipants.forEach(participant => participants.add(participant));
        prDetails.participants.push(...participants);

        const commitsResponse = await axios.get(`https://api.github.com/repos/ethereum/EIPs/pulls/${prNumber}/commits`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const commits = commitsResponse.data;
        prDetails.commits = commits.map(commit => commit.sha);

        const filesResponse = await axios.get(`https://api.github.com/repos/ethereum/EIPs/pulls/${prNumber}/files`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const files = filesResponse.data;
        prDetails.filesChanged = files.map(file => file.filename);

        res.json(prDetails);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/statusChanges/:year/:month', async (req, res) => {
    const { year, month } = req.params;

    try {
        // Convert year and month to numbers
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);

        // Get the start and end dates of the specified month and year
        const startDate = new Date(yearNum, monthNum - 1, 1);
        const endDate = new Date(yearNum, monthNum, 0);

        // Query the database for status changes within the specified date range
        const statusChanges = await StatusChange.aggregate([
            { $match: { changeDate: { $gte: startDate, $lte: endDate } } },
            {
                $group: {
                    _id: '$toStatus',
                    count: { $sum: 1 },
                    statusChanges: { $push: '$$ROOT' },
                },
            },
        ]);

        console.log(statusChanges);

        res.json(statusChanges);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: 'An error occurred' });
    }
});
