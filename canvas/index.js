let allurls = [];
let assets = [];
let uniqueTags = [];
let activeTags = [];


chrome.runtime.onMessage.addListener(async function(msg){
    if(msg.command === "page-load") {
        allurls = await fetchAssets("all_urls");
        console.log(allurls);
        assets = [];
        for(let url of allurls){
            let i = await fetchAssets(url);
            console.log(i);
            i.forEach(k => k.url = url)
            assets.push(i);   
        }
        console.log(assets);
        assets = assets.flat();
        assets = assets.map((asset,i) => {
            asset.key = i;
            return asset;
        })
        uniqueTags = getUniqueTags(assets)
        console.log(uniqueTags);
        loadFilters(uniqueTags);
        loadSideBar(assets);
    }
});


function getUniqueTags(arr){
    let uniqueTags = arr.map(item => item.tags);
    uniqueTags = uniqueTags.flat();
    uniqueTags = [...new Set(uniqueTags)];
    return uniqueTags;
}

function loadFilters(arr){
    let Filter = document.querySelector("div#filter");
    Filter.innerHTML = "";
    for(let i of arr){
        let tag = document.createElement("span");
        tag.className = "rounded-full bg-slate-100 px-2.5 py-0.5 font-sans text-sm text-slate-800";
        tag.addEventListener("click", filterHandler);
        tag.innerText = `${i}`;
        Filter.appendChild(tag);
    }
}

function filterHandler(e){
    console.log(e.target.innerText,e.target.className);
    if(!activeTags.includes(e.target.innerText)){
        e.target.className = "rounded-full bg-orange-100 px-2.5 py-0.5 text-sm text-orange-800";
        activeTags.push(e.target.innerText);
        filterByTags(activeTags);
        console.log(activeTags);
    }else{
        e.target.className = "rounded-full bg-slate-100 px-2.5 py-0.5 text-sm text-slate-800";
        activeTags.splice(activeTags.indexOf(e.target.innerText),1);
        filterByTags(activeTags);
        console.log(activeTags);
    }
}

function filterByTags(arr){

    let filteredAssets = assets.filter(asset => {
        return arr.every(i => asset.tags.includes(i));

    })
    console.log(filteredAssets);
    loadSideBar(filteredAssets);
}

function loadSideBar(assets){
    let sideBar = document.querySelector("div#content");
    sideBar.innerHTML = "";
    sideBar.className = "mt-4 mx-4 flex-col";
    for (let asset of assets){
        let card = SideBarCard(asset);
        sideBar.appendChild(card);
    }
}

function SideBarCard(obj) {
    let container = document.createElement("a");
    container.className = "flex flex-col bg-slate-100 outline-2 mb-4 pb-4 rounded-lg overflow-hidden"
    container.dataset.key = obj.key;
    container.draggable = true;
    container.target="_blank";
    container.href=obj.url;
    container.addEventListener("dragend",e => {
        let itemToBeAdded = assets[e.target.dataset.key];
        fabric.Image.fromURL(itemToBeAdded.data, function(i) {
            canvas.add(i);
            canvas.viewportCenterObject(i);
            console.log(canvas.getZoom());
            i.centeredScaling = true;
            i.scale(5);
            i.data = {
                url : itemToBeAdded.url
            }
            console.log(i.data.url);

        });
        // let text = itemToBeAdded.note
        // text = text.replace(/(.{1,60})/g, '$1\n');
        // console.log(text);
        // console.log(itemToBeAdded);
        // assets.splice(e.target.dataset.key,1);
    })

    let image = document.createElement("img");
        image.setAttribute("src",obj.data);
        image.dataset.key = obj.key;
        container.append(image);
    if(obj.note != ""){
        let note = document.createElement("p");
        note.className = "mx-4 mt-4 text-orange-800 font-serif text-sm"
        note.innerText = obj.note;
        container.append(note);
    }
    if(obj.tags.length != 0){
        let tagContainer = document.createElement("div");
        tagContainer.className = "w-full mx-4 mt-4 flex flex-wrap gap-2"

        let loadTagContainer = (arr) => {
            for(let i of arr){
                let tag = document.createElement("span");
                tag.className = "rounded-full bg-slate-300 px-2.5 py-0.5 text-sm text-slate-800";
                tag.innerText = `${i}`;
                tagContainer.appendChild(tag);
            }
        }
        loadTagContainer(obj.tags);
        container.append(tagContainer);
    }
    return container;
}










