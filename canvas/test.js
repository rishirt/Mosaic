let assets = [
    {
        type : "highlight",
        data : "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
        url : "https://www.google.com",
        tags : ["mosaic","interesting","hci","creativity"]
    },
    {
        type : "screenshot",
        data : "https://miro.medium.com/v2/resize:fit:1400/format:webp/1*9SgPhDHsM65np8Q1whJlJw.png",
        url : "https://www.google.com",
        tags : ["interaction","interesting","design","philosophy"]
    },
    {
        type : "highlight",
        data : "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
        url : "https://www.google.com",
        tags : ["mosaic","engineering","hci","design"]
    },
    {
        type : "screenshot",
        data : "https://miro.medium.com/v2/resize:fit:1400/format:webp/1*9SgPhDHsM65np8Q1whJlJw.png",
        url : "https://www.google.com",
        tags : ["mosaic","interesting","design"]
    },
    {
        type : "highlight",
        data : "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
        url : "https://www.google.com",
        tags : ["mosaic","interesting","hci","visualization"]
    },
    {
        type : "screenshot",
        data : "https://miro.medium.com/v2/resize:fit:1400/format:webp/1*9SgPhDHsM65np8Q1whJlJw.png",
        url : "https://www.google.com",
        tags : ["mosaic","interesting","design"]
    },
    {
        type : "highlight",
        data : "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
        url : "https://www.google.com",
        tags : ["mosaic","interesting","hci","design"]
    },
    {
        type : "screenshot",
        data : "https://miro.medium.com/v2/resize:fit:1400/format:webp/1*9SgPhDHsM65np8Q1whJlJw.png",
        url : "https://www.google.com",
        tags : ["mosaic","interesting","design"]
    },
    {
        type : "highlight",
        data : "Lorem ipsum dolor sit amet, consectetur adipiscing elit",
        url : "https://www.google.com",
        tags : ["mosaic","interesting","hci"]
    },
    {
        type : "screenshot",
        data : "https://miro.medium.com/v2/resize:fit:1400/format:webp/1*9SgPhDHsM65np8Q1whJlJw.png",
        url : "https://www.google.com",
        tags : ["mosaic","interesting","philosophy"]
    },
]

assets = assets.map((asset,i) => {
    asset.key = i;
    return asset;
})
console.log(assets);

let getUniqueTags = (arr) => {
    let uniqueTags = assets.map(item => item.tags);
    uniqueTags = uniqueTags.flat();
    uniqueTags = [...new Set(uniqueTags)];
    return uniqueTags;
}

let uniqueTags = getUniqueTags(assets);
let activeTags = [];

let filterHandler = (e) => {
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

let loadFilters = (arr) => {
    let Filter = document.querySelector("div#filter");
    for(let i of arr){
        let tag = document.createElement("span");
        tag.className = "rounded-full bg-slate-100 px-2.5 py-0.5 text-sm text-slate-800";
        tag.addEventListener("click", filterHandler);
        tag.innerText = `${i}`;
        Filter.appendChild(tag);
    }
}

let filterByTags = (arr) => {

    let filteredAssets = assets.filter(asset => {
        return arr.every(i => asset.tags.includes(i));

    })

    console.log(filteredAssets);
    loadSideBar(filteredAssets);

}

loadFilters(uniqueTags);

let createCard = (obj) => {
    let container = document.createElement("a");
    container.dataset.key = obj.key;
    container.draggable = true;
    container.addEventListener("dragend",e => {
        let index = assets.findIndex(i => i.key == e.target.dataset.key);
        let itemToBeAdded = assets[index];
        assets.splice(itemToBeAdded,1);
        console.log(itemToBeAdded);
        (assets);
    })
    container.target="_blank"
    container.className = "flex bg-slate-50 outline-2 mx-4 mb-4 rounded-lg overflow-hidden"
    
    if(obj.type == "highlight"){
        let highlightedText = document.createElement("p");
        highlightedText.className = "font-sans text-base leading-6 text-left text-orange-600 px-2 py-1.5"
        let tags = document.createElement("div");

        highlightedText.innerText = `${obj.data}` + `${obj.data}` + `${obj.data}` + `${obj.data}`;
        container.href = `${obj.url}`;
        container.append(highlightedText);
        return container;

    }else if(obj.type == "screenshot"){
        let image = document.createElement("img");

        let tags = document.createElement("div");

        image.src = `${obj.data}`;
        image.dataset.key = obj.key;
        container.href = `${obj.url}`;
        container.append(image);

        return container;

    }
}

function loadSideBar(assets){
    document.querySelector("div#content").innerHTML = "";
    for (let asset of assets){
        let card = createCard(asset);
        document.querySelector("div#content").appendChild(card);
    }
}

loadSideBar(assets);
