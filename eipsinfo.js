const express= require ('express')
const app= express()
require('dotenv').config();
const accessToken = process.env.ACCESS_TOKEN;


const axios=require('axios')

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

const getallinfo=async ()=>{
    let alleips = []
    let allinfo = []
    let allurls = []
    let allinfoobjs=[]
    try {
        const response = await axios.get('https://api.github.com/repos/ethereum/EIPs/contents/EIPS');
        // const data = await response.json();
        allinfo=response.data
        // console.log(allinfo[0]);
        console.log(allinfo);

        for(obj of allinfo){
            alleips.push(obj.name)
            allurls.push(obj.url)
        }
        // console.log(alleips)
        // console.log(allurls)

        // for(url of allurls){
        //     let newobj={eip:"",title:"",author:"",status:"",type:"",category:"",createdat:""}
        //     let newdata=await axios.get(url)
        //     let resultnewdata=newdata.data.content
        //     resultnewdata=base64ToText(resultnewdata)
        //     const extractednewdata=extractData(resultnewdata)

        //     newobj.eip=extractednewData.eip
        //     newobj.title=extractedData.title
        //     newobj.author=extractedData.author
        //     newobj.status=extractedData.status
        //     newobj.type=extractedData.type
        //     newobj.category=extractedData.category
        //     newobj.createdat=extractedData.created

        //     allinfoobjs.push(newobj)
        // }

        let currdata= await axios.get(allurls[3])
        let resultcontent=currdata.data.content
        // console.log(resultcontent)
    //    console.log(base64ToText(resultcontent))

       resultcontent=base64ToText(resultcontent)

        const extractedData = extractData(resultcontent);
        const extractedDetails = extractDetails(resultcontent);

        // console.log('EIP:', extractedData.eip);
        // console.log('Title:', extractedData.title);
        // console.log('Author:', extractedData.author);
        // console.log('Discussions Link:', extractedData['discussions-to']);
        // console.log('Status:', extractedData.status);
        // console.log('Type:', extractedData.type);
        // console.log('Category:', extractedData.category);
        // console.log('Created:', extractedData.created);

        // console.log('Details:');
        // console.log(extractedDetails);

    } catch (error) {
        console.log('Error:', error);
    }
} 


getallinfo()