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
            prevPage = msg.url;
            currentAssets = await fetchAssets(prevPage);
            console.log(currentAssets);
            currentTags = getUniqueTags(currentAssets);
            updateSideBar(currentAssets);
            getCurrentTabs();
        }
    }else if(msg.command === "take-screenshot"){
        getScreenshot();
    }
});

function handleSideBar(toggleSideBar) {
    if(toggleSideBar) {
        sideBar.style.visibility = "visible"
    } else {
        sideBar.style.visibility = "hidden"
    }
}

function getScreenshot() {
    let screenshotContainer = document.createElement("div");
        screenshotContainer.id = "mosaic-screenshot-container";
        screenshotContainer.className = "fixed top-1/2 left-1/2 w-1/6 h-1/6 border-4 bg-orange-100 border-orange-800 opacity-50 z-[1000000]"

    function snap(e) {
        if(e.key == "Enter"){
            screenshotContainer.style.backgroundColor = "rgba(201, 76, 76, 0)";
            currentScreenshotParams =  screenshotContainer.getBoundingClientRect();
            screenshotContainer.remove();
            chrome.runtime.sendMessage( {
                command : "get-screenshot"
            })
            document.removeEventListener("keyup",snap);
        }     
    }
    document.addEventListener("keyup",snap);
    document.body.append(screenshotContainer);
    handleSideBar(false);
    interact('#mosaic-screenshot-container')
        .resizable({
            edges: { left: true, right: true, bottom: true, top: true },

            listeners: {
                move (event) {
                    let target = event.target
                    let x = (parseFloat(target.getAttribute('data-x')) || 0)
                    let y = (parseFloat(target.getAttribute('data-y')) || 0)

                    target.style.width = event.rect.width + 'px'
                    target.style.height = event.rect.height + 'px'



                    // translate when resizing from top or left edges
                    x += event.deltaRect.left
                    y += event.deltaRect.top

                    target.style.transform = 'translate(' + x + 'px,' + y + 'px)'

                    target.setAttribute('data-x', x)
                    target.setAttribute('data-y', y)
                }
            },
            modifiers: [
                // keep the edges inside the parent
                interact.modifiers.restrict({
                    restriction: 'body',
                }),

            ],
            inertia: true
        })
        .draggable({
            listeners: { move: dragMoveListener},
            inertia: true,
            modifiers: [
                interact.modifiers.restrict({
                restriction: 'body'
             })
            ]
        })

    function dragMoveListener (event) {
        let target = event.target
        // keep the dragged position in the data-x/data-y attributes
        let x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx
        let y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy
  
        // translate the element
        target.style.transform = 'translate(' + x + 'px, ' + y + 'px)'
  
        // update the posiion attributes
        target.setAttribute('data-x', x)
        target.setAttribute('data-y', y)
    }
}

function updateSideBar(arr) {
    function SideBarCard(item) {
        let container = document.createElement("div");
            container.className = "flex flex-col bg-slate-100 outline-2 mb-4 pb-4 rounded-lg overflow-hidden"
        let image = document.createElement("img");
            image.setAttribute("src",item.data);
            container.append(image);
        if(item.note != ""){
            let note = document.createElement("p");
            note.className = "mx-4 mt-4 text-orange-800 font-serif text-sm"
            note.innerText = item.note;
            container.append(note);
        }
        if(item.tags.length != 0){
            let tagContainer = document.createElement("div");
            tagContainer.className = "w-full mx-4 mt-4 flex flex-wrap gap-2"

            let loadTagContainer = (arr) => {
                for(let i of arr){
                    let tag = document.createElement("span");
                    tag.className = "rounded-full bg-slate-300 px-2.5 py-0.5 font-sans text-sm text-slate-800";
                    tag.innerText = `${i}`;
                    tagContainer.appendChild(tag);
                }
            }
            loadTagContainer(item.tags);
            container.append(tagContainer);
        }

        return container;
    }

    if(arr.length > 0) {
        for(let item of arr) {
            if(item.type == "screenshot") {
                let card = SideBarCard(item);
                sideBarContents.append(card);
            }
        }
    }
}

function saveScreenShot(imageData) {
    let newAsset = {
        type : "screenshot",
        data : imageData
    };
    let activeTags = [];
    let background = document.createElement("div");
    background.id = "modal-background";
    background.className = "fixed flex items-center backdrop-blur-2xl top-0 bottom-0 left-0 right-0 z-[10000000]"
    document.body.append(background)
    let modal = document.createElement("div");
        modal.className = "w-2/5 m-auto flex-col bg-slate-100 rounded-lg p-4";
    let imageContainer = document.createElement("img");
        imageContainer.setAttribute("src",imageData);
        imageContainer.className = "w-auto max-h-80";
    let tagContainer = document.createElement("div");
        tagContainer.className = "w-full mt-4 flex flex-wrap gap-2"
    let addNote = document.createElement("textarea");
        addNote.rows = "4";
        addNote.placeholder = "Add a note about this image";
        addNote.className = "block w-full mt-4 p-2 rounded-md outline-none border-0 text-slate-900 font-sans text-sm shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-orange-500"
    let addTag = document.createElement("input");
        addTag.type = "text";
        addTag.placeholder = "Add tags for this image";
        addTag.className = "w-full mt-4 p-2 rounded-md outline-none border-0 text-slate-900 font-sans text-sm shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-orange-500"
    let buttons = document.createElement("div");
        buttons.className = "w-full flex justify-between mt-4"
    let cancelButton = document.createElement("button");
        cancelButton.className = "w-2/5 bg-slate-200 rounded-lg text-lg font-sans font-semibold py-2"
        cancelButton.innerText = "Cancel"
    let saveButton = document.createElement("button");
        saveButton.className = "w-2/5 bg-orange-600 rounded-lg text-white text-lg font-sans font-semibold py-2";
        saveButton.innerText = "Save";

    let loadTagContainer = (arr) => {
        tagContainer.innerHTML = "";
        for(let i of arr){
            let tag = document.createElement("span");
            tag.addEventListener("click", (e) => {
                if(!activeTags.includes(e.target.innerText)){
                    e.target.className = "rounded-full bg-orange-100 px-2.5 py-0.5 text-sm text-orange-800";
                    activeTags.push(e.target.innerText);
                    loadTagContainer(currentTags);
                }else{
                    e.target.className = "rounded-full bg-slate-300 px-2.5 py-0.5 text-sm text-slate-800";
                    activeTags.splice(activeTags.indexOf(e.target.innerText),1);
                    loadTagContainer(currentTags);
                }
            })
            if(activeTags.includes(i)){
                tag.className = "rounded-full bg-orange-100 px-2.5 py-0.5 text-sm text-orange-800";
            }else{
                tag.className = "rounded-full bg-slate-200 px-2.5 py-0.5 text-sm text-slate-800";
            }
            tag.innerText = `${i}`;
            tagContainer.appendChild(tag);
        }
    }

    loadTagContainer(currentTags);

    buttons.appendChild(cancelButton);
    buttons.appendChild(saveButton);
    modal.appendChild(imageContainer);
    modal.appendChild(tagContainer);
    modal.appendChild(addNote);
    modal.appendChild(addTag);
    modal.appendChild(buttons);
    background.append(modal);

    // saveButton.addEventListener("click",saveHandler);
    cancelButton.addEventListener("click",() => {
        console.log("clicked");
        background.remove();
    });

    saveButton.addEventListener("click",async (e) => {
        newAsset.tags = activeTags
        newAsset.note = addNote.value;

        currentAssets.push(newAsset);

        await chrome.storage.local.set({
            [document.location.href] : JSON.stringify(currentAssets)
        }).then(() => {
            console.log("storage updated");
        })
        let allURLS = [];

        await chrome.storage.local.get(["all_urls"]).then((result,err) => {
            if(result["all_urls"]){
                allURLS = JSON.parse(result["all_urls"])
                allURLS = [...new Set(allURLS)];
                console.log(allURLS);
            }else if(err){
                allURLS = [];
                console.log(allURLS);
            }
        });
        console.log(allURLS);
        await chrome.storage.local.set({
                ["all_urls"] : JSON.stringify([...allURLS,document.location.href])
        }).then(() => {
                console.log("urls updated");
        })

        background.remove();
        updateSideBar(currentAssets);
    })

    addTag.addEventListener("keyup",e => {
        if(e.key == "Enter"){
            activeTags.push(e.target.value);
            currentTags.push(e.target.value);
            e.target.value = "";
            loadTagContainer(currentTags);
        }
    })

}

async function getCurrentTabs() {
    // await chrome.tabs.query({
    //     active : true
    // }, (tabs) => {
    //     console.log(tabs);
    // })
    chrome.runtime.sendMessage({
        message : "get-current-tabs"
    },res => {
        console.log(res);
    })
}
