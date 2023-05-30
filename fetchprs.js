const express = require('express')
const axios = require('axios')

const app = express()

const port = 5000

app.listen(port, () => { console.log(`listening to port ${port}!`) })

const fetchAllPRsData = async () => {
    let allPRs = [];
    let allPRsObjs = [];
    let allPRsDBObjs = [];

    try {
        let page = 1;
        let perPage = 100;
        let response;

        do {
            response = await axios.get(
                `https://api.github.com/repos/ethereum/EIPs/pulls?state=open&page=${page}&per_page=${perPage}`
            );
            const prs = response.data;
            allPRs.push(...prs);
            page++;
            console.log('getting')
        } while (response.headers.link && response.headers.link.includes('rel="next"'));

        for (const obj of allPRs) {
            allPRsObjs.push(obj);
        }

        for (const obj of allPRsObjs) {
            let newobj = {
                merged_at: "",
                pr_number: "",
                EIP: "",
                title: "",
                day: "",
                month: "",
                year: "",
                date: "",
                time: "",
                url: ""
            };

            newobj.merged_at = obj.merged_at;
            newobj.pr_number = obj.number;
            newobj.title = obj.title;
            newobj.url = obj.url;

            let dateString = obj.created_at;

            // Convert the string to a Date object
            let date = new Date(dateString);

            // Extract the individual components
            let year = date.getFullYear();
            let month = date.getMonth() + 1; // Months are zero-based, so add 1
            let day = date.getDate();
            let hours = date.getHours();
            let minutes = date.getMinutes();
            let seconds = date.getSeconds();

            // Format the components as needed
            const formattedDate = `${year}-${month}-${day}`;
            const formattedTime = `${hours}:${minutes}:${seconds}`;

            newobj.date = formattedDate;
            newobj.year = year;
            newobj.day = day;
            newobj.month = month;
            newobj.time = formattedTime;

            let string = obj.title;

            // Extract the number using a regular expression
            const regex = /EIP-(\d+)/;
            const match = string.match(regex);

            if (match) {
                const number = match[1];
                newobj.EIP = number;
                // console.log('Number:', number);
            } else {
                console.log('Number not found in the string.');
            }

            allPRsDBObjs.push(newobj);
        }

        console.log('Total Open PRs:', allPRsDBObjs.length);
        console.log(allPRsDBObjs);
    } catch (error) {
        console.log('Error:', error);
    }
};

fetchAllPRsData();
