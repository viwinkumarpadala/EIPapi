const axios = require('axios');

const getMergedEvents = async () => {
    try {
        let allMergedEvents = [];

        let url = 'https://api.github.com/repos/ethereum/EIPs/events?per_page=100';

        while (url) {
            const response = await axios.get(url);
            const mergedEvents = response.data.filter(event => event.type === 'PullRequestEvent' && event.payload.action === 'closed' && event.payload.pull_request.merged === true);
            allMergedEvents.push(...mergedEvents);

            const linkHeader = response.headers.link;
            const nextPageUrl = getNextPageUrlFromLinkHeader(linkHeader);
            url = nextPageUrl;
        }

        console.log('Total merged events:', allMergedEvents.length);
        console.log(allMergedEvents);
    } catch (error) {
        console.log('Error:', error.message);
    }
};

const getNextPageUrlFromLinkHeader = (linkHeader) => {
    if (!linkHeader) {
        return null;
    }

    const links = linkHeader.split(',');
    for (const link of links) {
        const [url, rel] = link.split(';');
        if (rel.includes('rel="next"')) {
            return url.trim().slice(1, -1); 
        }
    }

    return null;
};

getMergedEvents();