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

const showItemInfo = async (instance) => {
    draggable.style.visibility = "visible";
    visibility = true;
    var item = vault[instance];
    var name = item.name;
    var rarity = item.rarity;
    if (rarity == undefined) {
        rarity = "";
    }
    var screenshot = item.screenshot;
    if (screenshot == "https://www.bungie.netundefined") {
        screenshot = "https://www.bungie.net/img/misc/missing_icon_d2.png";
    }
    var stats = item.stats;
    if (stats == undefined) {
        stats = [];
    }
    var perks = item.perks;
    if (perks == undefined) {
        perks = [];
    }
    var style = item.flavor;
    if (style == undefined) {
        style = "";
    }
    var armor = false;

    document.getElementById("screenshot").setAttribute("src", screenshot);
    document.getElementById("screenshot").setAttribute("title", name + "<br>" + rarity);

    document.getElementById("panelName").innerHTML = name;
    if (item.champion != 0) {
        document.getElementById("panelName").innerHTML += "<br>" + breakerNames[item.champion] + "  <img style=\"width:15px; height: 15px; top:2px; position:relative;\" src = \"" + breakers[item.champion] + "\">";
    }
    if (item.classtype == 3) {
        document.getElementById("type").innerHTML = rarity + " " + item.family +"<br>";
    } else {
        document.getElementById("type").innerHTML = classes[item.classtype] + " " + rarity + " " + item.family + "<br>";
    }
    document.getElementById("flavor").innerText = style;
    if(item.tags != undefined && item.tags.length != 0){
        let flavor = document.getElementById("panelName");
        let tags = document.createElement("div");
        tags.style.fontStyle = "normal";
        tags.innerText = "Tags: "
        for(let i = 0; i < item.tags.length; i++){
            tags.innerHTML += "<b>"+item.tags[i]+"</b>  ";
        }
        flavor.appendChild(tags);
    }
    document.getElementById("AddTagButton").setAttribute("onclick",`addTag("${bungieid}", "${instance}")`);
    document.getElementById("RemoveTagButton").setAttribute("onclick",`delTag("${bungieid}", "${instance}")`);

    var perkElement = document.getElementById("perks");
    perkElement.innerHTML = "";
    perks.forEach(perk => {
        var icon = document.createElement("img");
        icon.setAttribute("src", perk.icon);
        icon.setAttribute("class", "perk");
        icon.setAttribute("title", perk.name + "<br>" + perk.description.replace(/\n/g, "<br>"));
        var width = (20/perks.length);
        var minWidth = (350/perks.length);
        icon.style.width = "calc("+width + "vw)";
        icon.style.minWidth = minWidth+"px";
        if(perk.name.indexOf("Enhanced") != -1){
            icon.style.border = "2px solid #eade8b";
            icon.style.borderRadius = "200px";
            icon.style.width = "calc(-4px)";
        }
        perkElement.appendChild(icon);
    });

    var statsElement = document.getElementById("statName");
    statsElement.innerHTML = "";
    var barElement = document.getElementById("valueBar");
    barElement.innerHTML = "";
    var valueElement = document.getElementById("statValue");
    valueElement.innerHTML = "";
    var down = 0;
    statsElement.innerText = "";
    if (item.damagetype != "") {
        statsElement.innerHTML += "Element:<br>";
        valueElement.innerHTML += item.damagetype+" <img src=\"" + item.damageicon + "\" style=\"width: 15px; height: 15px; vertical-align: middle;\"> " +"<br>";
        down++;
    }
    if (item.light != "") {
        statsElement.innerHTML += "Light Level:<br>";
        valueElement.innerHTML += item.light + "<img src=\"/images/light.png\" style=\"width: 15px; height: 15px; vertical-align: middle;  transform: scaleX(-1);\">" +"<br>";
        down++;
    }

    barElement.style.marginTop = down * 19 + "px";
    var armorStatNames = ["Mobility", "Resilience", "Recovery", "Discipline", "Intellect", "Strength"];
    var armorTest = stats[0].name;

    if (armorStatNames.indexOf(armorTest) != -1) {
        armor = true;
    }

    if (armor) {
        stats.sort((s1, s2) => {
            //armor comparison function
            let order = ["Mobility", "Resilience", "Recovery", "Discipline", "Intellect", "Strength"];
            let i1 = order.indexOf(s1.name);
            let i2 = order.indexOf(s2.name);
            if (i1 == -1 || i2 == -1) {
                console.log("UNKNOWN STAT: " + s1.name);
                console.log("UNKNOWN STAT: " + s2.name);
            }
            return (i1 - i2);
        });
    } else {
        stats.sort((s1, s2) => {
            //weapon comparison function
            let order = ["Rounds Per Minute", "Draw Time", "Charge Time", "Magazine", "Blast Radius", "Velocity", "Impact", "Range", "Stability", "Handling", "Reload Speed", "Shield Duration", "Aim Assistance", "Airborne Effectiveness", "Accuracy", "Zoom", "Recoil Direction", "Swing Speed", "Guard Efficiency", "Guard Resistance", "Charge Rate", "Guard Endurance", "Ammo Capacity"];
            let i1 = order.indexOf(s1.name);
            let i2 = order.indexOf(s2.name);
            if (i1 == -1 || i2 == -1) {
                console.log("UNKNOWN STAT: " + s1.name);
                console.log("UNKNOWN STAT: " + s2.name);
            }
            return (i1 - i2);
        });
    }

    stats.forEach(stat => {
        var name = stat.name;
        var value = stat.value;
        var icon = stat.icon;
        var armor = false;
        if(name=="Aim Assistance"){
            name = "AA";
        }else if(name=="Airborne Effectiveness"){
            name ="AE";
        }else if(name=="Reload Speed"){
            name="Reload";
        }else if(name=="Recoil Direction"){
            name="Recoil";
        }
        else if(name=="Rounds Per Minute"){
            name="RPM";
        }
        statsElement.innerHTML += name+":<br>";
        if (icon != "https://bungie.netundefined") {
            valueElement.innerHTML += "<img src = " + icon + " style=\"height: 15px; width: auto; vertical-align: middle;\"> "+value+"<br>";
            armor = true;
        } else {
            valueElement.innerHTML += value + "<br>";
        }
        var bar = document.createElement("div");
        bar.className = "bar";
        bar.title = value;
        var innerBar = document.createElement("div");
        if (colorBars) {
            if (value > 45) {
                innerBar.style.backgroundColor = "rgb(0,200,0)";
            }
            else if (value > 15) {
                innerBar.style.backgroundColor = "rgb(200,200,0)";
            } else {
                innerBar.style.backgroundColor = "rgb(200,0,0)";
            }
        }
        if(value < 0) {
            innerBar.style.backgroundColor = "rgb(200,0,0)"
            value *= -1;
        }
        if (armor) {
            value *= 2.25;
        }
        innerBar.className = "innerBar";
        innerBar.style.width = value + "%";
        if (name == "RPM" || name == "Charge Time" || name == "Draw Time" || name == "Magazine") {
            bar.style.visibility = "hidden";
        }
        
        bar.appendChild(innerBar);
        barElement.appendChild(bar);
    })
}