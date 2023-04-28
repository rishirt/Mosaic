let tabs;
async function getTabs() {
    let tabs = await chrome.tabs.query({
        currentWindow : true
    })
    console.log(tabs);



    // for(let tab of tabs){
    //     chrome.tabs.remove(tab.id);
    // }
}

let activitiesSection = document.querySelector("div#activities");

let newActivityButton = document.querySelector("button#new-activity");
newActivityButton.addEventListener("click",() => {
    newActivityButton();
})

getTabs();
