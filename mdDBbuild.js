const mongoose = require('mongoose');
require('dotenv').config();
const accessToken = process.env.ACCESS_TOKEN;
const axios = require('axios');
const MdFiles = require('./models/mdfiles'); // Import the Mongoose model

const base64ToText = (base64Data) => {
    const buffer = Buffer.from(base64Data, 'base64');
    return buffer.toString('utf-8');
};

const extractData = (dataString) => {
    const regex = /---\n([\s\S]*?)\n---/;
    const match = regex.exec(dataString);
    if (match) {
        const metadataString = match[1];
        const metadataRegex = /(\w+):\s*(.*)/g;
        let metadata = {};
        let matchArr;

        while ((matchArr = metadataRegex.exec(metadataString)) !== null) {
            const key = matchArr[1].toLowerCase();
            const value = matchArr[2];
            metadata[key] = value;
        }

        return metadata;
    }
    return null;
};

const extractDetails = (dataString) => {
    const regex = /---\n([\s\S]*?)\n---/;
    const match = regex.exec(dataString);
    if (match) {
        const detailsString = dataString.substring(match[0].length).trim();
        return detailsString;
    }
    return null;
};

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log('Connected to the database');
        getallinfo();
    })
    .catch((error) => {
        console.log('Error connecting to the database:', error);
    });

const getallinfo = async () => {
    try {
        const headers = {
            Authorization: `Bearer ${accessToken}`,
        };

        const response = await axios.get('https://api.github.com/repos/ethereum/EIPs/contents/EIPS', { headers });
        const allinfo = response.data;
        let count = 1;

        for (const obj of allinfo) {
            const url = obj.url;
            const result = await axios.get(url, { headers });
            const resultContent = base64ToText(result.data.content);

            let extractedData = extractData(resultContent);
            if (Object.keys(extractedData).length === 0) {
                const regex = /EIP:\s*(\d+)\nTitle:\s*(.*?)\nAuthor:\s*(.*?)\nTo:\s*(.*?)\nType:\s*(.*?)\nCategory:\s*(.*?)\nStatus:\s*(.*?)\nDeadline:\s*(.*?)\nCreated:\s*(.*?)\nRequires:\s*(.*)/i;
                const [, eip, title, author, type, category, status, created, to, deadline, requires] = regex.exec(resultContent);

                extractedData = {
                    eip,
                    title,
                    author,
                    type,
                    category,
                    status,
                    created,
                    to,
                    deadline,
                    requires,
                };
            }

            const [year, month, date] = extractedData.created.split("-");
            const newcreateddate = new Date(year, month - 1, date);

            try {
                const newMdFile = new MdFiles({
                    eip: extractedData.eip || '',
                    title: extractedData.title || '',
                    author: extractedData.author || '',
                    status: extractedData.status || '',
                    type: extractedData.type || '',
                    category: extractedData.category || '',
                    created: newcreateddate || 'undefined',
                    requires: extractedData.requires || '',
                    discussion: extractedData.to || '',
                    deadline: extractedData.deadline || '',
                    unique_ID: count || null,
                });

                console.log(newMdFile);
                await newMdFile.save();
                count++;
                console.log('Data saved successfully.');
                console.log('Count:', count);
            } catch (error) {
                // Handle duplicate key error if eip already exists
                if (error.code === 11000) {
                    console.log(`Skipping duplicate EIP: ${extractedData.eip}`);
                } else {
                    console.log('Error:', error);
                }
            }
        }
    } catch (error) {
        console.log('Error:', error);
    } finally {
        mongoose.disconnect();
        console.log('Disconnected from the database');
    }
};
