var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
var draggable = document.getElementById("itemPanel");
var visibility = true;
draggable.onmousedown = dragMouseDown;
window.onkeydown = hide;

function hide(e) {
    console.log(e.keyCode);
    if (e.keyCode === 72) {
        if (visibility) {
            draggable.style.visibility = "hidden";
            visibility = false;
        } else {
            draggable.style.visibility = "visible";
            visibility = true;
        }

    }
    if (e.keyCode === 27){
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
    item = vault[item];
    var instance = Object.keys(item)[0];
    item = item[instance];
    var name = item.name;
    var rarity = item.rarity;
    if(rarity == undefined){
        rarity = "";
    }
    var screenshot = item.screenshot;
    if(screenshot == "https://www.bungie.netundefined"){
        screenshot = "https://www.bungie.net/img/misc/missing_icon_d2.png";
    }
    var stats = item.stats;
    if(stats == undefined){
        stats = [];
    }
    var perks = item.perks;
    if(perks == undefined){
        perks = [];
    }
    var style = item.flavor;
    if(style==undefined){
        style = "";
    }
    var armor = false;

    document.getElementById("screenshot").setAttribute("src", screenshot);
    document.getElementById("screenshot").setAttribute("title", name + "\n" + rarity);

    if(rarity != undefined){
        rarity+="<br>";
    }

    document.getElementById("panelName").innerText = name;
    document.getElementById("flavor").innerText = style;
    document.getElementById("type").innerHTML = rarity;

    var perkElement = document.getElementById("perks");
    perkElement.innerHTML = "";
    perks.forEach(perk => {
        var icon = document.createElement("img");
        icon.setAttribute("src", perk.icon);
        icon.setAttribute("class", "perk");
        icon.setAttribute("title", perk.name + "\n" + perk.description);
        var width = Math.floor(350 / perks.length);
        icon.style.width = width + "px";
        perkElement.appendChild(icon);
    });

    var statsElement = document.getElementById("stat");
    statsElement.innerHTML = "";
    var barElement = document.getElementById("valueBar");
    barElement.innerHTML = "";
    var down = 0;
    statsElement.innerText = "";
    if (item.damageType != "") {
        statsElement.innerHTML = "Damage Type: <img src=\"" + item.damageIcon + "\" style=\"width: 15px; height: 15px; vertical-align: middle;\"> " + item.damageType + "<br>";
        down++;
    }
    if (item.light != "") {
        statsElement.innerHTML += "Light Level: " + item.light + "<br>";
        down++;
    }

    barElement.style.marginTop = down * 19 + "px";
    var armorStatNames = ["Mobility", "Resilience", "Recovery", "Discipline", "Intellect", "Strength"];
    var 김정은 = Object.keys(stats[0])[0];

    if (armorStatNames.indexOf(김정은) != -1) {
        armor = true;
    }

    if (armor) {
        stats.sort((s1, s2) => {
            //armor comparison function
            let order = ["Mobility", "Resilience", "Recovery", "Discipline", "Intellect", "Strength"];
            let i1 = order.indexOf(Object.keys(s1)[0]);
            let i2 = order.indexOf(Object.keys(s2)[0]);
            if (i1 == -1 || i2 == -1) {
                console.log("UNKNOWN STAT: " + Object.keys(s1)[0]);
                console.log("UNKNOWN STAT: " + Object.keys(s2)[0]);
            }
            return (i1 - i2);
        });
    } else {
        stats.sort((s1, s2) => {
            //weapon comparison function
            let order = ["Rounds Per Minute", "Draw Time", "Charge Time", "Magazine", "Blast Radius", "Velocity", "Impact", "Range", "Stability", "Handling", "Reload Speed", "Shield Duration", "Aim Assistance", "Airborne Effectiveness", "Accuracy", "Zoom", "Recoil Direction", "Swing Speed", "Guard Efficiency", "Guard Resistance", "Charge Rate", "Guard Endurance", "Ammo Capacity"];
            let i1 = order.indexOf(Object.keys(s1)[0]);
            let i2 = order.indexOf(Object.keys(s2)[0]);
            if (i1 == -1 || i2 == -1) {
                console.log("UNKNOWN STAT: " + Object.keys(s1)[0]);
                console.log("UNKNOWN STAT: " + Object.keys(s2)[0]);
            }
            return (i1 - i2);
        });
    }

    stats.forEach(stat => {
        var name = Object.keys(stat)[0];
        var value = stat[name].value;
        var icon = stat[name].icon;
        var stat = name + ": " + value;
        var armor = false;
        if (icon != undefined) {
            statsElement.innerHTML += stat + "  <img src =https://bungie.net" + icon + " style=\"height: 15px; width: auto; vertical-align: middle;\"><br>";
            armor = true;
        } else {
            statsElement.innerHTML += stat + "<br>";
        }
        var bar = document.createElement("div");
        bar.className = "bar";
        bar.title = value;
        var innerBar = document.createElement("div");
        if (armor) {
            value *= 2.25;
        }
        if(name == "Ghost Energy Capacity"){
            value *= 10;
        }
        innerBar.className = "innerBar";
        innerBar.style.width = value + "%";
        if (name == "Rounds Per Minute" || name == "Charge Time" || name == "Draw Time" || name == "Magazine") {
            bar.style.visibility = "hidden";
        }
        bar.appendChild(innerBar);
        barElement.appendChild(bar);
    });
}