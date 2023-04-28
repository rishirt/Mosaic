let toggleSidebar = false;
let currentScreenshotImage = undefined;
let currentScreenshotParams = {};
let prevPage;

let currentAssets = [];
let currentTags = [];

const fetchAssets = (k) => {
    return new Promise((resolve) => {
        chrome.storage.local.get([k], obj => {
            resolve(obj[k] ? JSON.parse(obj[k]):[])
        })
    })
}

const getUniqueTags = (assets) => {
    let uniqueTags = assets.map(item => item.tags);
    uniqueTags = uniqueTags.flat();
    uniqueTags = [...new Set(uniqueTags)];
    return uniqueTags;
}

let sideBar = document.createElement("div");
let sideBarContents = document.createElement("div");
sideBarContents.className = "mt-4 mx-4 flex-col";
let sideBarHeading = document.createElement("h3");
sideBarHeading.className = "mt-4 mx-4 font-serif text-slate-100 text-xl font-bold"
sideBarHeading.innerText = "Previously Saved";

sideBar.append(sideBarHeading);
sideBar.append(sideBarContents);
document.body.append(sideBar);
sideBar.className = "w-1/4 max-h-screen min-h-screen drop-shadow-2xl bg-slate-800 fixed top-0 right-0 bottom-0 z-[1000000] overflow-y-scroll";
sideBar.style.visibility = "hidden";

chrome.runtime.onMessage.addListener(async function(msg){
    if(msg.command === "toggle-sidebar") {
        toggleSidebar = !toggleSidebar;
        console.log(toggleSidebar);
        handleSideBar(toggleSidebar);
    }else if(msg.command === "screenshot") {
        currentScreenshotImage = msg.data;
        if(currentScreenshotImage != undefined) {
            let {left,top,width,height} = currentScreenshotParams;
            let image = new Image();
            image.src = currentScreenshotImage;
            image.onload = async function() {
                let sourceImageWidth = this.width;
                let sourceImageHeight = this.height;
                let croppedImageWidth = (sourceImageWidth/window.innerWidth) * width;
                let croppedImageHeight = (sourceImageHeight/window.innerHeight) * height;
                let cropX = (sourceImageWidth/window.innerWidth) * left;
                let cropY = (sourceImageHeight/window.innerHeight) * top;
                let canvas = document.createElement("canvas");
                    canvas.setAttribute("width",croppedImageWidth + "px");
                    canvas.setAttribute("height",croppedImageHeight + "px");
                let context = canvas.getContext('2d');
                    context.drawImage(image,cropX,cropY,croppedImageWidth,croppedImageHeight,0,0,croppedImageWidth,croppedImageHeight);
                let croppedImageURL = canvas.toDataURL();
                saveScreenShot(croppedImageURL);
            }
        }
    }else if(msg.command === "page-load") {
        if(msg.url != prevPage){
            let key = 0;
            function addKey(element) {
                if (element.children.length > 0) {
                  Array.prototype.forEach.call(element.children, function(each, i) {
                    each.dataset.key = key++;
                    addKey(each)
                  });
                }
              };
            addKey(document.body);
            prevPage = msg.url;
            // currentAssets = await fetchAssets(prevPage);
            // console.log(currentAssets);
            // currentTags = getUniqueTags(currentAssets);
            // updateSideBar(currentAssets);
        }
    }else if(msg.command === "take-screenshot"){
        getScreenshot();
    }
});

document.body.addEventListener("selectionchange", (e) => {
    console.log(e);
    console.log("selection changed");
    function rangeToObj(range) {
        return {
          startKey: range.startContainer.parentNode.dataset.key,
          startTextIndex: Array.prototype.indexOf.call(range.startContainer.parentNode.childNodes, range.startContainer),
          endKey: range.endContainer.parentNode.dataset.key,
          endTextIndex: Array.prototype.indexOf.call(range.endContainer.parentNode.childNodes, range.endContainer),
          startOffset: range.startOffset,
          endOffset: range.endOffset
        }
    }
    let selection = window.getSelection();
    console.log(selection);
})









