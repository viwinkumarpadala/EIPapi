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

        // commitHistory.sort((a, b) => new Date(a.mergedDate) - new Date(b.mergedDate));

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
        category: currentCommit.category,
        type: currentCommit.type,
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
      currentCommit.newdeadline !== 'undefined'
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
        category: currentCommit.category,
        type: currentCommit.type,
        createdMonth: currentCommit.createdMonth,
        createdYear: currentCommit.createdYear,
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
      category: currentCommit.category,
      type: currentCommit.type,
      createdMonth: currentCommit.createdMonth,
      createdYear: currentCommit.createdYear,
      changedYear: changeDate.getFullYear(),
      changedMonth: changeDate.getMonth() + 1,
      changedDay: changeDate.getDate(),
    };

    statusChangeHistory.unshift(statusChange);
  }

//   for (let i = commitHistory.length - 1; i > 0; i--) {
  const currentCommit = commitHistory[commitHistory.length - 1];

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
        category: currentCommit.category,
        type: currentCommit.type,
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

fetchAndStoreEipHistory();
