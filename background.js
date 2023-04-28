chrome.action.onClicked.addListener(async function () {
    let tab = await chrome.tabs.query({
        url : chrome.runtime.getURL("/canvas/index.html"),
        pinned:true
    })

    if(tab.length == 0){
        chrome.tabs.create({ 
            url: chrome.runtime.getURL("/canvas/index.html"),
            pinned:true
        });
    }else {
        console.log(tab[0]);
        chrome.tabs.highlight({'tabs': tab[0].index}, function() {});
    }
});


chrome.runtime.onInstalled.addListener(() => {
    chrome.windows.getAll((windows) => {
        let currentTabs = [];
        for(let window of windows){
            chrome.tabs.query({
                windowId : window.id
            },(tabs) => {
                currentTabs.concat(tabs);
            })
        }
    })
})

chrome.commands.onCommand.addListener((command, tab) => {
    if(command == "toggle-sidebar"){
        chrome.tabs.sendMessage(tab.id,{
            command : "toggle-sidebar"
        })
    }else if(command == "toggle-canvas-controls"){
        chrome.tabs.sendMessage(tab.id,{
            command : "toggle-canvas-controls"
        })
    }else if(command == "take-screenshot"){
        chrome.tabs.sendMessage(tab.id,{
            command : "take-screenshot"
        })
    }

});

chrome.runtime.onMessage.addListener(async(message,sender) => {
    if(message.command === "get-screenshot"){
        console.log("taking screenshot");
        let imageData;
        setTimeout(() => {
            chrome.tabs.captureVisibleTab(async function (dataURL) {
                imageData = await dataURL;
                console.log(imageData);
                chrome.tabs.sendMessage(sender.tab.id, {
                    command : "screenshot",
                    data : imageData
                })
            });
        },1000)
    }else if(message.command === "get-canvas-data"){
            let allURLS = [];
            await chrome.storage.local.get(["all_urls"]).then((result,err) => {
                if(result["all_urls"]){
                    allURLS = JSON.parse(result["all_urls"])
                    allURLS = [...new Set(allURLS)];
                }else if(err){
                    allURLS = [];
                }
            });
            console.log(allURLS);

            async function loadAssets(f) {
                const loadedAssets = []
                await allURLS.forEach(async (element) => {
                    await chrome.storage.local.get([element]).then((result,err) => {
                        if(result[element]){
                            let urlAssets = JSON.parse(result[element]);
                            for(let asset of urlAssets){
                                asset.url = element;
                                loadedAssets.push(asset);
                            }
                        }else if(err){
                            console.log(err);
                        }
                    });
                });
                return loadedAssets;
            }
            const loadedAssets = loadAssets();
            loadedAssets.then((value) => {
                sendAssets(sender.tab.id,value);
            });
        }else if(message.command == "get-current-tabs"){
            await chrome.tabs.query({
                active : true
            }, (tabs) => {
                console.log(tabs);
            })
        }
    }
)

function sendAssets(recipient,value){
    chrome.tabs.sendMessage(recipient, {
        command : "canvas-data",
        data : JSON.stringify(value)
    })
}

chrome.tabs.onUpdated.addListener((tabId,changeInfo,tab) => {
    chrome.tabs.sendMessage(tabId,{
        command : "page-load",
        url : tab.url
    })
})


chrome.runtime.onMessage.addListener(async (message,sender) => {
    if(message == "get-current-tabs"){
        console.log("get-current-tabs");
        let windows = await chrome.windows.getAll((r) => {
            console.log(r);
        })

        windows.then(value => {
            console.log(value);
        })

    }
})



