//FUNCTIONS

//set current class
const setCurrent = (char) => {
    currentChar = char;
}

//setup class selector area
const selectorSetup = (data) => {
    // console.log(data);
    var characters = data.classes;

    //setup elements
    characters.forEach(character => {
        var cType = classes[character.classType]; //warlock, hunter, titan
        var cID = character.charId; //per character ID set by Bungie
        var emblem = character.emblem; //emblem link

        //setup inventory area
        var equip = document.getElementsByClassName('equip');
        for (var i = 0; i < equip.length; i++) {
            var charDiv = document.createElement('div');
            charDiv.id = cID + "." + equip[i].parentElement.id;
            charDiv.className = "charInventory glowHover";
            charDiv.innerHTML = " ";
            charDiv.addEventListener("dragover", (event) => {
                // prevent default to allow drop
                // console.log("above " + cID);
                event.preventDefault();
            });
            charDiv.addEventListener("drop", (event) => {
                event.preventDefault();
                document.getElementById("tempStyle").remove();
                var target = event.target.id;
                setCurrent(target);
                if (target != from) {
                    if (target[0] != "Vault" && from != "Vault") {
                        characterTransfer = true;
                    }
                    transferItem(transferData[0], 1, transferData[1], transferData[2], transferData[3], transferData[4], transferData[5]);
                }
            });

            equip[i].prepend(charDiv);
        }

        //setup character select button
        var charButton = document.createElement('button');
        charButton.innerText = cType;
        charButton.setAttribute("class", "selector classes");
        charButton.setAttribute("id", cID);
        //set emblem
        charButton.style.backgroundImage = 'url("https://bungie.net' + emblem + '")';
        //add to doc
        document.getElementById("characters").prepend(charButton);
    });
}

//Vault refresh
const refreshVault = async () => {
    return new Promise(async resolve => {
        await fetch("./users/" + bungieid + ".tags.json").then(async response => {
            try {
                let tags = JSON.parse(await response.text());
                let keys = Object.keys(tags);
                for (let i = 0; i < keys.length; i++) {
                    vault[keys[i]].tags = tags[keys[i]].tags;
                }
            } catch (err) {
                console.log(err);
            }
            if (document.getElementById("refreshMessage") != null) {
                document.getElementById("refreshMessage").remove();
            }
        });;

        vaultKeys = Object.keys(vault);

        var inventories = document.getElementsByClassName("inventory");
        var charInventories = document.getElementsByClassName("charInventory");

        cleanseCSS();

        for (var i = 0; i < inventories.length; i++) {
            inventories[i].innerHTML = "";
        }
        for (var i = 0; i < charInventories.length; i++) {
            charInventories[i].innerHTML = "";
            let temp = document.createElement('div');
            temp.className = "subEquip";
            temp.id = charInventories[i].id.split(".")[0];
            temp.style.gridColumn = "1/2"
            charInventories[i].appendChild(temp);
            temp = document.createElement('div');
            temp.className = "subEquip hahahahaaha";
            temp.id = charInventories[i].id.split(".")[0];
            temp.style.gridColumn = "3/4"
            charInventories[i].appendChild(temp);
        }

        vaultKeys.sort((i1, i2) => {
            i1 = vault[i1];
            i2 = vault[i2];
            if (i1 == i2) {
                return 0;
            }
            if (i1 == null) {
                return -1;
            } if (i2 == null) {
                return 1;
            }
            try {
                var order = ["Exotic", "Legendary", "Rare", "Uncommon", "Common"];
                var difference = 0;
                if (!powerFirst) {
                    difference = order.indexOf(i1.rarity.split(" ")[0]) - order.indexOf(i2.rarity.split(" ")[0]);
                }
                if (difference == 0) {
                    difference = i2.light - i1.light;
                }
                return (difference);
            } catch (err) {
                console.log(err);
                return (0);
            }

        });

        var i = -1;
        vaultKeys.forEach(item => {
            i++;
            try {
                ;
                let instance = item;
                item = vault[instance];
                var location = item.location + "." + item.type;
                var icon = item.icon;
                var hash = item.itemhash;
                var name = item.name;
                var rarity = item.rarity;
                var inVault = item.location != "Vault";
                var classType = item.classtype;
                var overlay = item.watermark;



                let add = document.createElement('img');
                add.setAttribute("src", icon);
                let tags = "";
                if (item.tags != undefined) {
                    for (let i = 0; i < item.tags.length; i++) {
                        tags += item.tags[i];
                        if (i < item.tags.length - 1) {
                            tags += "<br>";
                        }
                    }
                }
                let title = name + "<br>" + rarity;
                if (tags != "") {
                    title += "<br>tags:<br>" + tags;
                }
                add.setAttribute("title", title);
                add.setAttribute("draggable", "true");
                add.addEventListener("dragstart", () => {
                    var tempStyle = document.createElement("style");
                    tempStyle.id = "tempStyle";
                    tempStyle.innerHTML = `.item {pointer-events: none;} \n .glowHover{background-color: rgba(255,255,255,0.25);}`;
                    document.getElementById(instance).style.pointerEvents = "all";
                    document.getElementById(instance).firstElementChild.style.pointerEvents = "all";
                    transferData[0] = hash;
                    transferData[1] = inVault;
                    transferData[2] = instance;
                    transferData[3] = name;
                    transferData[4] = item.location;
                    transferData[5] = i;
                    from = location.split(".")[0];
                    document.body.appendChild(tempStyle);
                });
                add.addEventListener("dragend", () => {
                    document.getElementById(instance).removeAttribute("style");
                    document.getElementById(instance).firstElementChild.removeAttribute("style");;
                    document.getElementById("tempStyle").remove();
                });

                let watermark = document.createElement('img');
                watermark.setAttribute("src", overlay);
                watermark.style.pointerEvents = "none";
                watermark.style.position = "absolute";
                watermark.style.left = "0";
                watermark.style.top = "0";

                let button = document.createElement('button');
                button.setAttribute("class", "item");
                button.appendChild(add);
                if (location.indexOf("Emblems") == -1 && location.indexOf("Subclass") == -1) { button.appendChild(watermark); }

                try {
                    rarity = rarity.split(" ")[0];
                } catch {
                    rarity = "undefined";
                }

                let div = document.createElement('div');
                div.setAttribute("class", "hoverwrap " + item.location + " " + i + " " + rarity + " item topItem");
                div.setAttribute("id", instance);
                div.setAttribute("onclick", `showItemInfo("${instance}")`);

                if (location.split(".")[0] != "Vault" && !item.equipped) {
                    div.setAttribute("ondblclick", `equipItem("${instance}", "${location.split(".")[0]}", "${name}")`);
                }

                let hover = document.createElement('div');
                hover.setAttribute("class", "darken");

                let smallInfo = document.createElement('div');
                smallInfo.className = "smallInfo";
                if (item.champion == 0) {
                    smallInfo.innerHTML = "<img src=\"" + item.damageicon + "\" style=\"width: 10px; height: 10px;\"><p>" + item.light + "</p>";
                } else {
                    smallInfo.innerHTML = "<img src=\"" + breakers[item.champion] + "\" style=\"width: 10px; height: 10px;\"><img src=\"" + item.damageicon + "\" style=\"width: 10px; height: 10px;\"><p>" + item.light + "</p>";
                }

                div.appendChild(button);
                div.appendChild(smallInfo);
                div.appendChild(hover);

                try {
                    if (classType == 3 || inVault || location.indexOf("Power") != -1 || location.indexOf("Kinetic") != -1 || location.indexOf("Energy") != -1) {
                        if (location.split(".")[0] == "Vault") {
                            document.getElementById(location).appendChild(div);
                        } else {
                            if (item.equipped) {
                                document.getElementById(location).firstElementChild.appendChild(div);
                            } else {
                                document.getElementById(location).lastElementChild.appendChild(div);
                            }
                        }
                    } else {
                        var upperLevel = document.getElementById(location);
                        if (document.getElementById(location + "." + classType) == undefined) {
                            var temp = document.createElement("div");
                            temp.id = location + "." + classType;
                            if (classType == 0) {
                                temp.innerHTML = '<svg viewbox="0 0 32 32"><path fill="currentColor" d="m14.839 15.979-13.178-7.609v15.218zm2.322 0 13.178 7.609v-15.218zm5.485-12.175-6.589-3.804-13.178 7.609 13.178 7.609 13.179-7.609zm0 16.784-6.589-3.805-13.178 7.609 13.178 7.608 13.179-7.608-6.59-3.805z"></path></svg>';
                            } else if (classType == 1) {
                                temp.innerHTML = '<svg viewbox="0 0 32 32"><path fill="currentColor" d="m9.055 10.446 6.945-.023-6.948 10.451 6.948-.024-7.412 11.15h-7.045l7.036-10.428h-7.036l7.032-10.422h-7.032l7.507-11.126 6.95-.024zm13.89 0-6.945-10.446 6.95.024 7.507 11.126h-7.032l7.032 10.422h-7.036l7.036 10.428h-7.045l-7.412-11.15 6.948.024-6.948-10.451z"></path></svg>';
                            } else if (classType == 2) {
                                temp.innerHTML = '<svg viewbox="0 0 32 32"><path fill="currentColor" d="m5.442 23.986 7.255-11.65-2.71-4.322-9.987 15.972zm5.986 0 4.28-6.849-2.717-4.333-6.992 11.182zm7.83-11.611 7.316 11.611h5.426l-10.015-15.972zm-7.26 11.611h8.004l-4.008-6.392zm6.991-11.182-2.703 4.324 4.302 6.858h5.413zm-5.707-.459 2.71-4.331 2.71 4.331-2.703 4.326z"></path></svg>';
                            }
                            temp.className = "classVault";
                            upperLevel.appendChild(temp);
                        }
                        var lowerLevel = document.getElementById(location + "." + classType);
                        lowerLevel.appendChild(div);
                    }
                } catch {
                    // console.log(location);
                }
            } catch (err) {
                console.log("refresh vault error " + err);
            }
            search(document.getElementById("searchBox").value);
        });
        resolve(200)
    });
}

const loadImages = () => {
    let keys = Object.keys(vault);
    keys.forEach(item => {
        item = vault[item];
        let hidden = document.getElementById("hidden");
        let perks = item.perks;
        let stats = item.stats;
        if (perks != undefined) {
            perks.forEach(link => {
                link = link.icon;
                if (document.getElementById(link.split("/")[link.split("/").length - 1]) == null) {
                    let temp = document.createElement("link");
                    temp.setAttribute("href", link);
                    temp.setAttribute("rel", "prerender");
                    temp.setAttribute("as", "image");
                    let type = link.split(".");
                    temp.setAttribute("type", "image/" + type[type.length - 1]);
                    temp.setAttribute("id", link.split("/")[link.split("/").length - 1]);
                    hidden.appendChild(temp);
                } else {
                    // console.log(link + " already exists");
                }
            });
        }
        if (stats != undefined && stats[0].icon != "https://bungie.netundefined") {
            stats.forEach(link => {
                link = link.icon;
                if (document.getElementById(link.split("/")[link.split("/").length - 1]) == null) {
                    let temp = document.createElement("link");
                    temp.setAttribute("href", link);
                    temp.setAttribute("rel", "prerender");
                    temp.setAttribute("as", "image");
                    let type = link.split(".");
                    temp.setAttribute("type", "image/" + type[type.length - 1]);
                    temp.setAttribute("id", link.split("/")[link.split("/").length - 1]);
                    hidden.appendChild(temp);
                } else {
                    // console.log(link + " already exists");
                }
            });
        }
        if (item.screenshot != undefined && item.screenshot != "https://bungie.netundefined") {
            if (document.getElementById("item.screenshot.split(" / ")[item.screenshot.split(" / ").length-1]") == null) {
                let temp = document.createElement("link");
                temp.setAttribute("href", item.screenshot);
                temp.setAttribute("rel", "prerender");
                temp.setAttribute("as", "image");
                let type = item.screenshot.split(".");
                temp.setAttribute("type", "image/" + type[type.length - 1]);
                temp.setAttribute("id", item.screenshot.split("/")[item.screenshot.split("/").length - 1])
                hidden.appendChild(temp);
            } else {
                // console.log(item.screenshot + " already exists");
            }
        }
        if (item.icon != undefined && item.icon != "https://bungie.netundefined") {
            if (document.getElementById("item.screenshot.split(" / ")[item.screenshot.split(" / ").length-1]") == null) {
                let temp = document.createElement("link");
                temp.setAttribute("rel", "preload");
                temp.setAttribute("href", item.icon);
                temp.setAttribute("as", "image");
                let type = item.icon.split(".");
                temp.setAttribute("type", "image/" + type[type.length - 1]);
                temp.setAttribute("id", item.icon.split("/")[item.screenshot.split("/").length - 1])
                hidden.appendChild(temp);
            } else {
                // console.log(item.screenshot + " already exists");
            }
        }
        if (item.watermark != undefined && item.watermark != "https://bungie.netundefined") {
            if (document.getElementById("item.screenshot.split(" / ")[item.screenshot.split(" / ").length-1]") == null) {
                let temp = document.createElement("link");
                temp.setAttribute("rel", "preload");
                temp.setAttribute("href", item.watermark);
                temp.setAttribute("as", "image");
                let type = item.watermark.split(".");
                temp.setAttribute("type", "image/" + type[type.length - 1]);
                temp.setAttribute("id", item.watermark.split("/")[item.screenshot.split("/").length - 1])
                hidden.appendChild(temp);
            } else {
                // console.log(item.screenshot + " already exists");
            }
        }
    });
    return;
}

//Vault refresh helper
const internalVaultRefresh = async () => {
    var messageID = "refreshMessage";
    if (document.getElementById(messageID) != null) {
        return;
    }
    var message = document.createElement("p");
    message.innerHTML = "Refreshing vault";
    message.setAttribute("id", messageID);
    message.setAttribute("class", "message");
    document.getElementById("status").appendChild(message);
    fetch("/refresh?d2id=" + d2id + "&bungieid=" + bungieid + "&type=" + membershipType)
        .then(async () => {
            fetch("./users/" + bungieid + ".vault.json").then(async response => {
                vault = JSON.parse(await response.text()).data;
                // console.log(vault);
                await loadImages();
                refreshVault();
            });
        });
}

//Swaps the place of item from vault to inventory
/*
instance = instance id
character = starting/destination character
vault
{
    true = to vault
    false = to character
}
*/
const swap = (toVault, instance, character) => {
    return new Promise(async (resolve) => {
        //variable setup

        var changeTo = "";
        if (toVault) {
            changeTo = "Vault";
        }
        else {
            changeTo = character + "";
        }

        vault[instance].location = changeTo;
        await refreshVault();
        resolve(200)
    })
}

//Transfer Item
const transferItem = async (hash, stack, v, instance, name, starting, pos, message) => {
    //Send status notification
    var random = instance + "status";
    if (document.getElementById(random) != null) {
        return;
    }
    if (message == undefined) {
        var message = document.createElement("p");
        message.innerHTML = "Moving " + name;
        message.setAttribute("id", random);
        message.setAttribute("class", "message");
        document.getElementById("status").appendChild(message);
        if (currentChar == "") {
            message.innerHTML = "Invalid request!";
            await new Promise(r => setTimeout(r, 2500));
            document.getElementById(random).remove();
            return;
        }
    }

    //character variable setup
    var character;
    if (!v) {
        character = currentChar;
    } else {
        character = starting;
    }

    //Send request
    fetch("./transfer?hash=" + hash + "&stack=" + stack + "&vault=" + v + "&instance=" + instance + "&character=" + character + "&bungie=" + bungieid)
        .then(async (response) => {
            var error = "";
            if (response.status == 200) {
                await swap(v, instance, character);
                error = ("Successfully transfered: " + name);
            }
            console.log(response);
            if (!characterTransfer) {
                message.innerText = error;
            }
        }).then(async () => {
            document.getElementById(random).id += "REMOVE";
            if (characterTransfer) {
                characterTransfer = false;
                await transferItem(hash, stack, !v, instance, name, starting, pos, message);
            }
            await new Promise(r => setTimeout(r, 2500));
            document.getElementById(random + "REMOVE").remove();
        });
}

//Equip Item
const equipItem = async (instance, character, name) => {
    //Send status notification
    var random = instance + "status";
    if (document.getElementById(random) != null) {
        return;
    }
    var message = document.createElement("p");
    message.innerHTML = "Equipping " + name;
    message.setAttribute("id", random);
    message.setAttribute("class", "message");
    document.getElementById("status").appendChild(message);

    //Send request
    fetch("./equip?instance=" + instance + "&character=" + character + "&bungie=" + bungieid)
        .then(async (response) => {
            var error = await response.text();
            if (response.status == 200) {
                await equipSwap(instance);
                error = ("Successfully equipped: " + name);
            }
            console.log(error);
            message.innerText = error;
        }).then(async () => {
            document.getElementById(random).id += "REMOVE";
            await new Promise(r => setTimeout(r, 2500));
            document.getElementById(random + "REMOVE").remove();
        });
}

//Swap equipped item
const equipSwap = (instance) => {
    return new Promise(async resolve => {
        let equipped = document.getElementById(instance).parentElement.parentElement.firstElementChild.firstElementChild.id;
        vault[instance].equipped = true;
        vault[equipped].equipped = false;
        await refreshVault();
        resolve(200);
    })
}

//cleanse css variables
const cleanseCSS = () => {
    try {
        document.documentElement.style.setProperty(`--opacity`, '0');
        let items = document.getElementsByClassName("topItem");
        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            item.style.removeProperty("--opacity");
        }
        let labels = document.getElementsByClassName("ui-tooltip");
        for (let i = 0; i < labels.length; i++) {
            labels[i].remove();
        }
    }
    catch (err) { console.log(err); }
}

//add tag
const addTag = async (bungie, instance) => {
    console.log(instance);
    let tag = prompt("Enter tag name:");
    console.log(instance);
    await fetch(`/tag?bungie=${bungie}&&instance=${instance}&&tag=${tag.toLowerCase()}`);
    await refreshVault();
    showItemInfo(instance);
}

//delete tag
const delTag = async (bungie, instance) => {
    let tag = prompt("Enter tag name:");
    await fetch(`/deltag?bungie=${bungie}&&instance=${instance}&&tag=${tag.toLowerCase()}`);
    await refreshVault();
    showItemInfo(instance);
}

//refresh cycle
const cycle = async () => {
    while (true) {
        if (!document.hidden) {
            await internalVaultRefresh();
            await new Promise(r => setTimeout(r, 30000));
        }else{
            await new Promise(r => setTimeout(r, 10000));
        }
    }
}