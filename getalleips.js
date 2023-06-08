const axios = require('axios');
require('dotenv').config();
const accessToken = process.env.ACCESS_TOKEN;

async function getMarkdownFiles() {
    try {
        const repositoryURL = 'https://api.github.com/repos/ethereum/EIPs';
        const contentsURL = `${repositoryURL}/contents/EIPS`;

        const response = await axios.get(contentsURL, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            params: {
                per_page: 100,
            },
        });

        const files = response.data.filter(file => file.name.endsWith('.md'));
        const filePaths = files.map(file => file.path);

        console.log('Markdown Files:');
        console.log(filePaths);

        return filePaths;
    } catch (error) {
        console.error('Error retrieving markdown files:', error.message);
        return [];
    }
}

getMarkdownFiles();
