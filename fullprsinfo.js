const axios = require('axios');
require('dotenv').config();

const accessToken = process.env.ACCESS_TOKEN;

const fetchPRDetails = async (prNumber) => {
    try {
        

        const prResponse = await axios.get(`https://api.github.com/repos/ethereum/EIPs/pulls/${prNumber}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const prData = prResponse.data;

        console.log('PR Title:', prData.title);
        console.log('PR Description:', prData.body);
        console.log('Labels:', prData.labels.map(label => label.name).join(', '));

        const requestor = prData.user.login;

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

        console.log('Conversations:', allConversations);
        console.log('Number of Conversations:', allConversations.length);

        const participants = new Set(
            allConversations
                .filter((conversation) => conversation.user.login !== 'github-actions[bot]')
                .map((conversation) => conversation.user.login)
        );

        const commentParticipants = new Set(
            reviewComments
                .filter((comment) => comment.user.login !== 'github-actions[bot]')
                .map((comment) => comment.user.login)
        );

        commentParticipants.forEach((participant) => participants.add(participant));

        participants.add(requestor);

        console.log('Number of Participants:', participants.size);
        console.log('Participant Names:', Array.from(participants).join(', '));

        // const reviewers = prData.requested_reviewers.map(reviewer => reviewer.login);
        // console.log('Reviewers:', reviewers.join(', '));

        const commitsResponse = await axios.get(`https://api.github.com/repos/ethereum/EIPs/pulls/${prNumber}/commits`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const commits = commitsResponse.data;
        console.log('Commits:', commits);
        console.log('Number of Commits:', commits.length);

        // const checksResponse = await axios.get(`https://api.github.com/repos/ethereum/EIPs/check-runs`, {
        //     params: {
        //         check_suite_id: prData.head.sha,
        //     },
        //     headers: {
        //         Authorization: `Bearer ${accessToken}`,
        //     },
        // });

        // const checks = checksResponse.data;
        // console.log('Checks:', checks);
        // console.log('Number of Checks:', checks.total_count);

        const filesResponse = await axios.get(`https://api.github.com/repos/ethereum/EIPs/pulls/${prNumber}/files`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const files = filesResponse.data;
        // console.log('Files Changed:', files);
        console.log('Number of Files Changed:', files.length);

        const mergeResponse = await axios.get(`https://api.github.com/repos/ethereum/EIPs/pulls/${prNumber}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const mergeData = mergeResponse.data;

        console.log('Merge Date:', mergeData.merged_at);
        console.log('Number of Conversations:', allConversations.length);
        console.log('Number of Participants:', participants.size);
        console.log('Participant Names:', Array.from(participants).join(', '));
        // console.log('Reviewers:', reviewers.join(', '));
        console.log('Number of Commits:', commits.length);
        console.log('Number of Files Changed:', files.length);
        console.log('files changed:', files[0].filename);
        console.log('Labels:', prData.labels.map(label => label.name).join(', '));
        // console.log(prData);
    } catch (error) {
        console.log('Error:', error.message);
    }
};

const prNumber = 3987;
fetchPRDetails(prNumber);

