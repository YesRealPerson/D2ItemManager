// Global variables that can be edited from the settings menu

// When true makes stat bars colored
let colorBars = false;
const toggleColor = () => {
    color = !color;
    if (color) {
        document.getElementById("colorToggle").title = "Colored stats"
        document.getElementById("colorToggle").innerText = "Remove color from stat bars"
    } else {
        document.getElementById("colorToggle").title = "No color"
        document.getElementById("colorToggle").innerText = "Show color on stat bars"
    }
}
// When true sorts vault by power first rather than by rarity
let sort = false;
const toggleSort = () => {
    sort = !sort;
    if (sort) {
        document.getElementById("sortToggle").title = "Sorting by power"
        document.getElementById("sortToggle").innerText = "Sort vault by rarity"
    } else {
        document.getElementById("sortToggle").title = "Sorting by rarity"
        document.getElementById("sortToggle").innerText = "Sort vault by power"
    }
}

const showSettings = () => {
    document.getElementById("settingsPanel").style.visibility = "visible";
}
const showHelp = () => {
    document.getElementById("helpPanel").style.visibility = "visible";
}
const deleteWindows = () => {
    let windows = document.getElementsByClassName("window");
    for (let i = 0; i < windows.length; i++) {
        windows[i].style.visibility = "hidden";
    }
}