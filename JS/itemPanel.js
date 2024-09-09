let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
let draggable = document.getElementById("itemPanel");
let visibility = true;
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
    let y = draggable.offsetTop - pos2;
    let x = draggable.offsetLeft - pos1;

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
    let tierTypes = {
        3: "Common",
        4: "Rare",
        5: "Legendary",
        6: "Exotic"
    };
    let damageTypes = {
        1: "Kinetic",
        2: "Arc",
        3: "Solar",
        4: "Void",
        5: "",
        6: "Stasis",
        7: "Strand"
    };
    let damageImages = {
        1: "https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_3385a924fd3ccb92c343ade19f19a370.png",
        2: "https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_092d066688b879c807c3b460afdd61e6.png",
        3: "https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_2a1773e10968f2d088b97c22b22bba9e.png",
        4: "https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_ceb2f6197dccf3958bb31cc783eb97a0.png",
        5: "https://www.bungie.net/img/misc/missing_icon_d2.png",
        6: "https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_530c4c3e7981dc2aefd24fd3293482bf.png",
        7: "https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_b2fe51a94f3533f97079dfa0d27a4096.png"
    };
    let armorNames = {
        47: "Chestplate",
        49: "Class Item",
        46: "Gauntlets",
        45: "Helmet",
        48: "Legs"
    }
    let breakers = ["", "https://www.bungie.net/common/destiny2_content/icons/DestinyBreakerTypeDefinition_07b9ba0194e85e46b258b04783e93d5d.png", "https://www.bungie.net/common/destiny2_content/icons/DestinyBreakerTypeDefinition_da558352b624d799cf50de14d7cb9565.png", "https://www.bungie.net/common/destiny2_content/icons/DestinyBreakerTypeDefinition_825a438c85404efd6472ff9e97fc7251.png"];
    let breakerNames = ["", "Anti-Barrier", "Overload Rounds", "Unstoppable Rounds"];
    draggable.style.visibility = "visible";
    visibility = true;
    let name = item.name;
    let rarity = tierTypes[item.rarity];
    if (!rarity) {
        rarity = "";
    }
    let screenshot = item.background;
    if (!screenshot) {
        screenshot = "https://www.bungie.net/img/misc/missing_icon_d2.png";
    }
    let stats = item.stats;
    if (!stats) {
        stats = [];
    }
    let perks = item.perks;
    if (!perks) {
        perks = [];
    }
    let style = item.flavor;
    if (!style) {
        style = "";
    }
    let armor = item.type[1] != 1;;

    document.getElementById("screenshot").setAttribute("src", "https://bungie.net" + screenshot);
    document.getElementById("screenshot").setAttribute("title", name + "<br>" + rarity);

    document.getElementById("panelName").innerHTML = name;
    // Champion types
    if (item.breakerType != 0) {
        document.getElementById("panelName").innerHTML += "<br>" + breakerNames[item.champion] + "  <img style=\"width:15px; height: 15px; top:2px; position:relative;\" src = \"" + breakers[item.champion] + "\">";
    }
    document.getElementById("flavor").innerText = style;
    // if(item.tags != undefined && item.tags.length != 0){
    //     let flavor = document.getElementById("panelName");
    //     let tags = document.createElement("div");
    //     tags.style.fontStyle = "normal";
    //     tags.innerText = "Tags: "
    //     for(let i = 0; i < item.tags.length; i++){
    //         tags.innerHTML += "<b>"+item.tags[i]+"</b>  ";
    //     }
    //     flavor.appendChild(tags);
    // }
    // document.getElementById("AddTagButton").setAttribute("onclick",`addTag("${bungieid}", "${instance}")`);
    // document.getElementById("RemoveTagButton").setAttribute("onclick",`delTag("${bungieid}", "${instance}")`);

    let perkElement = document.getElementById("perks");
    perkElement.innerHTML = "";
    let totalPerks = 0;
    perks.forEach(perk => {
        totalPerks += perk.length
    })
    perks.forEach(perkColumn => {
        let column = document.createElement("div");
        column.className = "perkColumn"
        for (let i = 0; i < perkColumn.length; i++){
            try {
                let perk = perkColumn[i]
                let icon = document.createElement("img");
                let width = (20 / perks.length);
                let minWidth = (350 / perks.length);
                icon.setAttribute("src", "https://bungie.net"+perk.icon);
                icon.setAttribute("class", "perk");
                icon.setAttribute("title", perk.name + "<br>" + perk.description.replace(/\n/g, "<br>"));
                icon.style.width = "calc(" + width + "vw)";
                icon.style.minWidth = minWidth + "px";
                if (perk.enhanced) {
                    icon.style.border = "2px solid #eade8b";
                    icon.style.borderRadius = "200px";
                    icon.style.width = "calc(-4px)";
                    icon.setAttribute("title", "Enhanced " + perk.name + "<br>" + perk.description.replace(/\n/g, "<br>"));
                }
                column.appendChild(icon);
            } catch (err) {
                console.log(err);
            }
        }
        perkElement.appendChild(column);
    });

    let statsElement = document.getElementById("statName");
    statsElement.innerHTML = "";
    let barElement = document.getElementById("valueBar");
    barElement.innerHTML = "";
    let valueElement = document.getElementById("statValue");
    valueElement.innerHTML = "";
    let down = 0;
    statsElement.innerText = "";
    if (damageTypes[item.element]) {
        statsElement.innerHTML += "Element:<br>";
        valueElement.innerHTML += damageTypes[item.element] + " <img src=\"" + damageImages[item.element] + "\" style=\"width: 15px; height: 15px; vertical-align: middle;\"> " + "<br>";
        down++;
    }
    if (item.light != "") {
        statsElement.innerHTML += "Light Level:<br>";
        valueElement.innerHTML += item.light + "<img src=\"/IMG/light.png\" style=\"width: 15px; height: 15px; vertical-align: middle;  transform: scaleX(-1);\">" + "<br>";
        down++;
    }

    barElement.style.marginTop = down * 19 + "px";
    let armorStatNames = ["Mobility", "Resilience", "Recovery", "Discipline", "Intellect", "Strength"];
    let armorTest = stats[0].name;

    if (armorStatNames.indexOf(armorTest) != -1) {
        armor = true;
    }

    if (armor) {
        let temp = rarity + " " + manifests[4][item.type[0]].shortTitle;
        if(armorNames[item.type[1]]){
            temp += " " + armorNames[item.type[1]];
        }
        document.getElementById("type").innerHTML =  + "<br>";
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
        let temp = rarity + " " + manifests[4][item.type[2]].shortTitle;
        if(temp[temp.length-1] == "s"){
            temp = temp.substring(0,temp.length-1);
        }
        document.getElementById("type").innerHTML = temp + "<br>";
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
        let name = stat.name;
        let value = stat.value;
        let icon = stat.icon;
        let armor = false;
        if (name == "Aim Assistance") {
            name = "AA";
        } else if (name == "Airborne Effectiveness") {
            name = "AE";
        } else if (name == "Reload Speed") {
            name = "Reload";
        } else if (name == "Recoil Direction") {
            name = "Recoil";
        }
        else if (name == "Rounds Per Minute") {
            name = "RPM";
        }
        statsElement.innerHTML += name + ":<br>";
        if (icon) {
            valueElement.innerHTML += "<img src = https://bungie.net" + icon + " style=\"height: 15px; width: auto; vertical-align: middle;\"> " + value + "<br>";
            armor = true;
        } else {
            valueElement.innerHTML += value + "<br>";
        }
        let bar = document.createElement("div");
        bar.className = "bar";
        bar.title = value;
        let innerBar = document.createElement("div");
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
        if (value < 0) {
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