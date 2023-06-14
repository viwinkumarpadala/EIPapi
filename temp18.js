const axios = require('axios');
require('dotenv').config();
const mongoose = require('mongoose');
const EipHistory = require('./models/eiphistory');

const eipno = 1;

async function getCommitsWithEipNumber(eipNumber) {
    let overallhistory = [];

    try {
        // Connect to the MongoDB database
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to the database');

        // Fetch commit history with the specified EIP number
        const commitHistory = await EipHistory.find({ eip: eipNumber });
        console.log(commitHistory);

        overallhistory = commitHistory;

        // Get the status change history
        const statusChangeHistory = getStatusChangeHistory(overallhistory);
        console.log(statusChangeHistory);
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        // Disconnect from the MongoDB database
        mongoose.disconnect();
        console.log('Disconnected from the database');
    }
}

function getStatusChangeHistory(commitHistory) {
    const statusChangeHistory = [];

    for (let i = commitHistory.length - 1; i > 0; i--) {
        const currentCommit = commitHistory[i - 1];
        const previousCommit = commitHistory[i];

        if (currentCommit.status !== previousCommit.status) {
            const statusChange = {
                fromStatus: previousCommit.status,
                toStatus: currentCommit.status,
                changeDate: currentCommit.mergedDate,
                changeDay: currentCommit.mergedDay-1,
                changeMonth: currentCommit.mergedMonth,
                changeYear: currentCommit.mergedYear
            };

            statusChangeHistory.unshift(statusChange);
        }
    }

    return statusChangeHistory;
}

getCommitsWithEipNumber(eipno);
