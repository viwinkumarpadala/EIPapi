const axios = require('axios');

const repoOwner = 'ethereum';
const repoName = 'EIPs';
const accessToken = process.env.ACCESS_TOKEN;
const year = 2023;
const month = 5;

const getRepositoryInfo = async () => {
    try {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        const startISODate = startDate.toISOString();
        const endISODate = endDate.toISOString();

        const commitsResponse = await axios.get(`https://api.github.com/repos/${repoOwner}/${repoName}/commits`, {
            params: {
                since: startISODate,
                until: endISODate,
                access_token: accessToken,
            },
        });
        const commitsCount = commitsResponse.data.length;

        const pullRequestsResponse = await axios.get(`https://api.github.com/repos/${repoOwner}/${repoName}/pulls`, {
            params: {
                state: 'all',
                access_token: accessToken,
            },
        });
        const mergedPRsCount = pullRequestsResponse.data.filter(pr => pr.merged_at && pr.merged_at >= startISODate && pr.merged_at <= endISODate).length;
        const openPRsCount = pullRequestsResponse.data.filter(pr => pr.state === 'open').length;

        const issuesResponse = await axios.get(`https://api.github.com/repos/${repoOwner}/${repoName}/issues`, {
            params: {
                state: 'all',
                access_token: accessToken,
            },
        });
        const closedIssuesCount = issuesResponse.data.filter(issue => issue.state === 'closed' && issue.closed_at >= startISODate && issue.closed_at <= endISODate).length;
        const newIssuesCount = issuesResponse.data.filter(issue => issue.state === 'open' && issue.created_at >= startISODate && issue.created_at <= endISODate).length;

        return {
            commits: commitsCount,
            mergedPRs: mergedPRsCount,
            openPRs: openPRsCount,
            closedIssues: closedIssuesCount,
            newIssues: newIssuesCount,
        };
    } catch (error) {
        throw error;
    }
};

getRepositoryInfo()
    .then(repositoryInfo => {
        console.log(repositoryInfo);
    })
    .catch(error => {
        console.error(error);
    });
