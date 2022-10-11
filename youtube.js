const puppeteer = require('puppeteer');
const PDFDoc = require('pdfkit');
const fs = require('fs');

let cTab;
let link = 'https://www.youtube.com/playlist?list=PLRBp0Fe2GpglDkRdEd_BhnSkHo8FgPmzs';


(async function(){
    try{
        let browserOpen = puppeteer.launch({
            headless: false,
            defaultViewport:null,
            args: ['--start-maximized']
        })
        let browser = await browserOpen;
        let allTabs = await browser.pages();
        cTab = allTabs[0];
        await cTab.goto(link);
        await cTab.waitForSelector("h1#title");
        
        
        let name = await cTab.evaluate(function(select){
            return document.querySelector(select).innerText
        }, "h1#title");
        name = name.split('|');
        name= name[0];
        
        await cTab.waitForSelector('div#stats .style-scope.ytd-playlist-sidebar-primary-info-renderer');
        let dataVideo = await cTab.evaluate(getData, 'div#stats .style-scope.ytd-playlist-sidebar-primary-info-renderer');
        console.log(name , dataVideo.noViews, dataVideo.numVideos);

        let totVid = dataVideo.numVideos.split(" ")[0];
        
        //jo scroll krne ke pehle ke videos nikale
        let currVideos = await getCurrVideosLength();
        console.log(currVideos);

        while(totVid - currVideos >= 20){
            await scrollToBottom();
            currVideos = await getCurrVideosLength();
        }

        let vidList = await getStats();
        // console.log(vidList);

        let pdf = new PDFDoc();
        pdf.pipe(fs.createWriteStream('playlist.pdf'));
        pdf.text(JSON.stringify(vidList));
        pdf.end();


        
    }catch (err){
        console.log(err);
    }
})();


async function getStats(){
    let list = await cTab.evaluate(getVidDetails, "#video-title", "#thumbnail span#text")
    return list;
}

async function getVidDetails(videoSelector, durationSelector){
    let vidElem = document.querySelectorAll(videoSelector);
    let durElem = document.querySelectorAll(durationSelector);

    let currentList = [];
    for(let i=0;i<durElem.length;i++){
        let videoTitle = vidElem[i].innerText;
        let duration = durElem[i].innerText;
        currentList.push({videoTitle, duration});
    }

    return currentList;
}


async function scrollToBottom(){
    await cTab.evaluate(goToBottom);
    function goToBottom(){
        window.scrollBy(0,window.innerHeight);
    }
}


async function getCurrVideosLength(selector){
    let length = await cTab.evaluate(getLength,"#content>#container>#thumbnail")
    return length;

}

async function getLength(durationSelector){
    let durationEle = document.querySelectorAll(durationSelector);
    return durationEle.length;
}

async function getData(selector){
    let allElem = document.querySelectorAll(selector);
    let numVideos = allElem[0].innerText;
    let noViews = allElem[1].innerText;

    return {
        noViews,
        numVideos
    }
}