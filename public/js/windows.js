const deleteWindows = () => {
    let windows = document.getElementsByClassName("window");
    for(var i = 0; i<windows.length; i++){
        let w = windows[i];
        w.style.visibility = "hidden";
    }
}

const settings = () => {
    document.getElementById("settingsPanel").style.visibility = "visible";
}

const help = () => {
    document.getElementById("helpPanel").style.visibility = "visible";
}

//toggle sort
const toggleSort = () => {
    let toggleElement = document.getElementById("sortToggle");
    if(powerFirst){
        powerFirst = false;
        toggleElement.innerHTML = "Sort vault by power";
        toggleElement.title = "Sorting vault by rarity";
    }else{
        powerFirst = true;
        toggleElement.innerHTML = "Sort vault by rarity";
        toggleElement.title = "Sorting vault by power";
    }
    refreshVault();
}

//toggle color
const toggleColor = () => {
    let toggleElement = document.getElementById("colorToggle");
    if(colorBars){
        colorBars = false;
        toggleElement.innerHTML = "Show color on stat bars";
        toggleElement.title = "No color on stat bars";
    }else{
        colorBars = true;
        toggleElement.innerHTML = "Hide color on stat bars";
        toggleElement.title = "Color on stat bars";
    }
}