const axios = require('axios');
require('dotenv').config();
const mongoose = require('mongoose');
const StatusChange = require('./models/StatusChange');
const EipHistory = require('./models/eiphistory');
const MdFiles = require('./models/mdfiles');

async function fetchAndStoreEipHistory() {
    try {
        // Connect to the MongoDB database
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to the database');

        const uniqueEipNumbers = await MdFiles.distinct('eip');

        // Iterate over each EIP number
        for (const eipNumber of uniqueEipNumbers) {
            const commitHistory = await EipHistory.find({ eip: eipNumber });

            // Get the status change history
            const statusChangeHistory = getStatusChangeHistory(commitHistory);

            // Store the status change history in the database
            await StatusChange.insertMany(statusChangeHistory);
        }

        console.log('EIP history stored successfully');
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
                eip: previousCommit.eip,
                title: previousCommit.title,
                author: previousCommit.author,
                fromStatus: previousCommit.status,
                toStatus: currentCommit.status,
                changeDate: currentCommit.mergedDate,
            };

            // Extract year, month, and day from changeDate
            const changeDate = new Date(currentCommit.mergedDate);
            statusChange.changedYear = changeDate.getFullYear();
            statusChange.changedMonth = changeDate.getMonth() + 1;
            statusChange.changedDay = changeDate.getDate();

            statusChangeHistory.unshift(statusChange);
        }
    }

    return statusChangeHistory;
}


fetchAndStoreEipHistory();
