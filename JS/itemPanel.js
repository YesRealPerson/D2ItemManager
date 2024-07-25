var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
var draggable = document.getElementById("itemPanel");
var visibility = true;
draggable.onmousedown = dragMouseDown;
window.onkeydown = hide;

function hide(e) {
    // console.log(e.keyCode);
    if (e.keyCode === 72 && document.activeElement != document.getElementById('searchBox')) {
        if (visibility) {
            draggable.style.visibility = "hidden";
            visibility = false;
        } else {
            draggable.style.visibility = "visible";
            visibility = true;
        }

    }
    if (e.keyCode === 27) {
        deleteWindows();
    }
    if (e.keyCode === 82) {
        draggable.style.left = 0;
        draggable.style.top = 250 + "px";
    }
}

function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
}

function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    var y = draggable.offsetTop - pos2;
    var x = draggable.offsetLeft - pos1;

    if (y > 0 && y < window.innerHeight - 50) {
        draggable.style.top = y + "px";
        draggable.style.left = x + "px";
    }
}

function closeDragElement() {
    /* stop moving when mouse button is released:*/
    document.onmouseup = null;
    document.onmousemove = null;
}

const showItemInfo = async (item) => {
}