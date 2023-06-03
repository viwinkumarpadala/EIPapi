const axios = require('axios');

const fetchAllPRsData = async () => {
    try {
        const perPage = 100;
        const response = await axios.get(
            `https://api.github.com/repos/ethereum/EIPs/pulls?state=closed&per_page=${perPage}`
        );
        const allPRs = response.data.slice(0, 100); // Limit the PRs to the first 100 items

        const allPRsDBObjs = allPRs.map((obj) => {
            const {
                merged_at,
                number: pr_number,
                title,
                url,
                created_at,
            } = obj;

            const date = new Date(created_at);
            const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
            const formattedTime = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;

            const regex = /EIP-(\d+)/;
            const match = title.match(regex);
            const EIP = match ? match[1] : '';

            return {
                merged_at,
                pr_number,
                EIP,
                title,
                day: date.getDate(),
                month: date.getMonth() + 1,
                year: date.getFullYear(),
                date: formattedDate,
                time: formattedTime,
                url,
            };
        });

        console.log('Total Open PRs:', allPRsDBObjs.length);
        console.log(allPRsDBObjs);
    } catch (error) {
        console.log('Error:', error);
    }
};

fetchAllPRsData();
