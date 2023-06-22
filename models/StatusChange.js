const mongoose = require('mongoose');

// Define the StatusChange schema
const statusChangeSchema = new mongoose.Schema({
    eip:{
        type: String,
        required:true
    }, 
    fromStatus: {
        type: String,
        required: true,
    },
    toStatus: {
        type: String,
        required: true,
    },
    title: { type: String },
    status:{type: String}, 
    author: { type: String },
    created: { type: Date },
    changeDate: { type: Date },
    type: { type: String },
    category: { type: String },
    discussion: { type: String },
    deadline: { type: String },
    requires: { type: String },
    changedDay: { type: Number },
    changedMonth: { type: Number },
    changedYear: { type: Number },
    createdMonth: { type: Number },
    createdYear: { type: Number },
});

// Create the StatusChange model
const StatusChange = mongoose.model('StatusChange', statusChangeSchema);

module.exports = StatusChange;
