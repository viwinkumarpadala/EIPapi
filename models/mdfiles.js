const mongoose = require('mongoose');

const mdFilesSchema = new mongoose.Schema({
    eip: { type: String },
    title: { type: String },
    author: { type: String },
    status: { type: String },
    type: { type: String },
    category: { type: String },
    created: { type: Date },
    discussion: { type: String },
    deadline: { type: String },
    requires: { type: String },
    unique_ID:{type:Number}
});

const MdFiles = mongoose.model('MdFiles', mdFilesSchema);

module.exports = MdFiles;
