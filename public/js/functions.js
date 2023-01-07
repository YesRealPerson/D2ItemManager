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
                var target = event.target.id.split(".");
                setCurrent(target[0]);
                transferItem(transferData[0], 1, transferData[1], transferData[2], 3, transferData[3], transferData[4]);
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
const refreshVault = () => {
    fetch("/users/" + bungieid + ".vault.json")
        .then((response) => {
            //if vault exists
            //Really shouldn't be possible for it to not exist but whatever
            if (response.ok) {
                return response.text();
            } else {
                throw new Error("Profile JSON does not exist for " + bungieid);
            }
        }).then((data) => {
            vault = JSON.parse(data).data;

            var inventories = document.getElementsByClassName("inventory");
            var charInventories = document.getElementsByClassName("charInventory");

            for (var i = 0; i < inventories.length; i++) {
                inventories[i].innerHTML = "";
            }
            for (var i = 0; i < charInventories.length; i++) {
                charInventories[i].innerHTML = "";
            }

            vault.sort((i1, i2) => {
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
                    var i1 = i1[Object.keys(i1)[0]];
                    var i2 = i2[Object.keys(i2)[0]];
                    var difference = order.indexOf(i1.rarity.split(" ")[0]) - order.indexOf(i2.rarity.split(" ")[0]);
                    if(powerFirst){
                        difference = 0;
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
            vault.forEach(item => {
                i++;
                try {
                    var instance = Object.keys(item)[0];
                    var itemJSON = item;
                    item = item[instance];
                    var location = item.location + "." + item.type;
                    var icon = item.icon;
                    var hash = item.itemHash;
                    var name = item.name;
                    var rarity = item.rarity;
                    var inVault = item.location != "Vault";
                    var overlay = item.watermark;

                    let add = document.createElement('img');
                    add.setAttribute("src", icon);
                    add.setAttribute("title", name + "\n" + rarity);
                    add.setAttribute("draggable", "true");
                    add.addEventListener("dragstart", () => {
                        var tempStyle = document.createElement("style");
                        tempStyle.id = "tempStyle";
                        tempStyle.innerHTML = ".item {pointer-events: none;} \n .glowHover{background-color: rgba(255,255,255,0.25);}";
                        transferData[0] = hash;
                        transferData[1] = inVault;
                        transferData[2] = instance;
                        transferData[3] = name;
                        transferData[4] = item.location;
                        document.body.appendChild(tempStyle);
                    });
                    add.addEventListener("dragend", () => {
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
                    button.appendChild(watermark);

                    try {
                        rarity = rarity.split(" ")[0];
                    } catch {
                        rarity = "undefined";
                    }

                    let div = document.createElement('div');
                    div.setAttribute("class", "hoverwrap " + item.location + " " + i + " " + rarity + " item topItem");
                    div.setAttribute("id", instance);
                    div.setAttribute("onclick", `showItemInfo(${i})`);

                    let hover = document.createElement('div');
                    hover.setAttribute("class", "darken");

                    let smallInfo = document.createElement('div');
                    smallInfo.className = "smallInfo";
                    smallInfo.innerHTML = "<img src=\"" + item.damageIcon + "\" style=\"width: 10px; height: 10px; vertical-align: middle;\"><p>" + item.light + "</p>";

                    div.appendChild(button);
                    div.appendChild(smallInfo);
                    div.appendChild(hover);
                    try {
                        document.getElementById(location).appendChild(div);
                    } catch {
                        // console.log(location);
                    }
                } catch (err) {
                    console.log("refresh vault error " + err);
                }
            });
            if (document.getElementById("refreshMessage") != null) {
                document.getElementById("refreshMessage").remove();
            }
        });
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
    fetch("/refresh?d2id=" + d2id + "&bungieid=" + bungieid)
        .then(async (response) => {
            response.json()
                .then(data => {
                    vault = data;
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
const swap = (hash, vault, instance, name, character) => {
    //variable setup
    var tbd = document.getElementById(instance);
    var temp = tbd.cloneNode(true);

    var changeTo = "";
    if (vault) {
        changeTo = "Vault";
        var destination = document.getElementById(
            tbd
                .parentNode
                .parentNode
                .parentNode
                .id)
            .lastElementChild;
    }
    else {
        var itemType = tbd
            .parentNode
            .parentNode
            .id;
        var destination = document.getElementById(character + "." + itemType);
        changeTo = character + "";
    }

    var elementClasses = temp
        .className
        .split(" ");

    //change attributes

    elementClasses[1] = changeTo;
    elementClasses = elementClasses.join(" ");

    temp.setAttribute("class", elementClasses);

    //set drag events
    //temp.firstElementChild
    temp.firstElementChild.addEventListener("dragstart", () => {
        var tempStyle = document.createElement("style");
        tempStyle.id = "tempStyle";
        tempStyle.innerHTML = ".item {pointer-events: none;}\n .glowHover{background-color: rgba(255,255,255,0.25);}";
        transferData[0] = hash;
        transferData[1] = !vault;
        transferData[2] = instance;
        transferData[3] = name;
        transferData[4] = character;
        document.body.appendChild(tempStyle);
    });

    destination.appendChild(temp);
    tbd.remove();
}

//Transfer Item
const transferItem = async (hash, stack, vault, instance, membership, name, starting) => {
    //Send status notification
    var random = instance + "status";
    if (document.getElementById(random) != null) {
        return;
    }
    var message = document.createElement("p");
    message.innerHTML = "Attempting transfer of " + name;
    message.setAttribute("id", random);
    message.setAttribute("class", "message");
    document.getElementById("status").appendChild(message);
    if (currentChar == "") {
        message.innerHTML = "Select a character!";
        await new Promise(r => setTimeout(r, 2500));
        document.getElementById(random).remove();
        return;
    }

    //character variable setup
    var character;
    if (!vault) {
        character = currentChar;
    } else {
        character = starting;
    }

    //Send request
    // console.log("Sending request");
    fetch("./transfer?hash=" + hash + "&stack=" + stack + "&vault=" + vault + "&instance=" + instance + "&character=" + character + "&membership=" + membership + "&bungie=" + bungieid)
        .then(async (response) => {
            var error = await response.text();
            if (response.status == 200) {
                error = "Successfully transfered: " + name;
                swap(hash, vault, instance, name, character);
            }
            console.log(error);
            message.innerHTML = JSON.stringify(error);
        }).then(async () => {
            document.getElementById(random).id += "REMOVE";
            await new Promise(r => setTimeout(r, 2500));
            document.getElementById(random + "REMOVE").remove();
        });
}