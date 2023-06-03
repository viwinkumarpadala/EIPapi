const axios = require('axios');

const fetchPRDetails = async (prNumber) => {
    try {
        const accessToken = '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';

        const prResponse = await axios.get(`https://api.github.com/repos/ethereum/EIPs/pulls/${prNumber}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const prData = prResponse.data;

        console.log('PR Title:', prData.title);
        console.log('PR Description:', prData.body);
        // console.log(prData)

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

        console.log('Conversations:', allConversations);
        console.log('Number of Conversations:', allConversations.length);

        const participants = new Set(allConversations.map((conversation) => conversation.user.login));
        console.log('Number of Participants:', participants.size);
        console.log('Participant Names:', Array.from(participants).join(', '));

        const commitsResponse = await axios.get(`https://api.github.com/repos/ethereum/EIPs/pulls/${prNumber}/commits`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const commits = commitsResponse.data;
        console.log('Commits:', commits);
        console.log('Number of Commits:', commits.length);

        const checksResponse = await axios.get(`https://api.github.com/repos/ethereum/EIPs/check-runs`, {
            params: {
                check_suite_id: prData.head.sha,
            },
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const checks = checksResponse.data;
        console.log('Checks:', checks);
        console.log('Number of Checks:', checks.total_count);

        const filesResponse = await axios.get(`https://api.github.com/repos/ethereum/EIPs/pulls/${prNumber}/files`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const files = filesResponse.data;
        console.log('Files Changed:', files);
        console.log('Number of Files Changed:', files.length);
    } catch (error) {
        // console.log('Error:', error.message);
    }
};

const prNumber = 7099; // Replace with the desired PR number
fetchPRDetails(prNumber);
