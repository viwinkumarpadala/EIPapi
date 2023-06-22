const mongoose = require('mongoose');

const eipHistorySchema = new mongoose.Schema({
    eip: { type: String } ,
    title: { type: String },
    author: { type: String },
    status: { type: String },
    type: { type: String },
    category: { type: String },
    created: { type: Date }, 
    discussion: { type: String },
    deadline: { type: String },
    requires: { type: String },
    commitSha: { type: String },
    commitDate: { type: Date },
    mergedDate: { type: Date },
    prNumber: { type: Number },
    closedDate: { type: Date },
    changes: { type: Number },
    insertions: { type: Number },
    deletions: { type: Number },
    mergedDay: { type: Number },
    mergedMonth: { type: Number },
    mergedYear: { type: Number },
    createdDate: { type: Date },
    createdMonth: { type: Number },
    createdYear: { type: Number },
    previousdeadline: { type: String },
    newdeadline: { type: String },
    message: { type: String },
});

const EipHistory = mongoose.model('EipHistory', eipHistorySchema);

module.exports = EipHistory;
