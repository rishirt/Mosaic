let canvasContainer = document.querySelector("#canvasContainer");
let sideBar = document.querySelector("#sidebar");

sideBar.style.width = `${window.innerWidth * 0.25}px`;
sideBar.style.height = `${window.innerHeight}px`;
sideBar.className = "min-h-screen max-h-screen w-auto overflow-y-scroll drop-shadow-2xl bg-slate-800 flex flex-col box-border border-r border-slate-300"
canvasContainer.setAttribute("width",`${window.innerWidth * 0.75}px`);
canvasContainer.setAttribute("height",`${window.innerHeight}px`);

let canvas = new fabric.Canvas('canvasContainer',{
    backgroundColor : "#f1f5f9"
});

function fetchAssets(k) {
    return new Promise((resolve) => {
        chrome.storage.local.get([k], obj => {
            resolve(obj[k] ? JSON.parse(obj[k]): [])
        })
    })
}



async function loadCanvas() {
    function fetchCanvas() {
        return new Promise((resolve) => {
            chrome.storage.local.get(["canvas-state"], obj => {
                resolve(obj["canvas-state"] ? JSON.parse(obj["canvas-state"]): undefined);
            })
        })
    }
    let canvasState = await fetchCanvas("canvas-state");
    console.log(canvasState);
    canvas.loadFromJSON(canvasState.canvasJSON, function() {
        canvas.renderAll(); 
    },function(o,object){
        console.log(o,object)
    })
    canvas.setZoom(canvasState.canvasZoom);
}


loadCanvas();

let posX,posY;
function registerCanvasHandlers() {
    canvas.on('mouse:wheel', function(opt) {
        let delta = opt.e.deltaY;
        let zoom = canvas.getZoom();
        zoom *= 0.999 ** delta;
        if (zoom > 20) zoom = 20;
        if (zoom < 0.01) zoom = 0.01;
        canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
        opt.e.preventDefault();
        opt.e.stopPropagation();
    });
    
    canvas.on('mouse:down', function(opt) {
        let event = opt.e;
        if (opt.target && event.altKey) {
            console.log('an object was clicked! ', opt.target);
            chrome.tabs.create({
                url : opt.target.data.url
            })
        }
        if(event.shiftKey){
            this.isDragging = true;
            this.selection = false;
            this.lastPosX = event.clientX;
            this.lastPosY = event.clientY;
        }
    });
    canvas.on('mouse:move', function(opt) {

        let pointer = canvas.getPointer(opt.e,false);
        posX = pointer.x;
        posY = pointer.y;
        // console.log(posX+", "+posY);

        if (this.isDragging) {
            var e = opt.e;
            var vpt = this.viewportTransform;
            vpt[4] += e.clientX - this.lastPosX;
            vpt[5] += e.clientY - this.lastPosY;
            this.requestRenderAll();
            this.lastPosX = e.clientX;
            this.lastPosY = e.clientY;
        }
    });
    canvas.on('mouse:up', function(opt) {
        this.setViewportTransform(this.viewportTransform);
        this.isDragging = false;
        this.selection = true;
    });
    canvas.on('object:modified',async function(opt){
        let canvasState = {
            canvasJSON : JSON.stringify(canvas),
            canvasZoom : canvas.getZoom(),
            canvasViewport : canvas.viewportTransform
        }
        await chrome.storage.local.set({
            ["canvas-state"] : JSON.stringify(canvasState)
        }).then(() => {
            console.log("storage updated");
        })
    })




// canvas.on("selection:created", function(opt) {
//     console.log(canvas.getZoom());
//     for(let object of opt.selected){
//         console.log(object.data);
//         object.data.inSelection = true;
//         console.log(object.data);
//     }

}

registerCanvasHandlers();



document.addEventListener("keydown",async e => {
    console.log(e.key);
    if(e.key == "Backspace" && e.metaKey){
        console.log(  canvas.getActiveObject().type);
        canvas.remove(canvas.getActiveObject());
            let canvasState = {
                canvasJSON : JSON.stringify(canvas),
                canvasZoom : canvas.getZoom(),
                canvasViewport : canvas.viewportTransform
            }

            await chrome.storage.local.set({
                ["canvas-state"] : JSON.stringify(canvasState)
            }).then(() => {
                console.log("storage updated");
            })
        }
        else if(e.key == "t"){
            if(canvas.getActiveObject() == undefined){
                let text = new fabric.IText("You can edit this",{
                    width : 450,
                    fontFamily: 'Hanken Grotesk',
                    fill : "black",
                    fontSize : 80,
                    left : posX,
                    top : posY
                });
        
                text.scale(10);
                canvas.add(text);


            }

    }else if(e.key == "g" && e.metaKey){
        console.log("g");
        e.preventDefault();
        console.log(canvas.getActiveObject().type);
        if (canvas.getActiveObject().type == 'activeSelection') {
            canvas.getActiveObject().toGroup();
            canvas.requestRenderAll();
        }else {
            canvas.getActiveObject().toActiveSelection();
            canvas.requestRenderAll();
        }
    }else if(e.key == "p" && e.metaKey){
        e.preventDefault();
        canvas.isDrawingMode = !canvas.isDrawingMode;
    }
})

canvas.isDrawingMode = false;
canvas.freeDrawingBrush.color = "red";
canvas.freeDrawingBrush.width = 5;





