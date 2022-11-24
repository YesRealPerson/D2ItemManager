//FUNCTIONS

//set current class
const setCurrent = (char, classType) => {
    var selectors = document.getElementsByClassName("selector");
    for (var i = 0; i < selectors.length; i++) {
        if (selectors[i].id == char) {
            selectors[i].style.borderColor = "rgb(150,20,20)";
        } else if (selectors[i].id != "refresh") {
            selectors[i].style.borderColor = "white";
        }
    }
    currentChar = char;
    document.getElementById("select").innerHTML = classType;
}

//setup class selector area
const selectorSetup = (data) => {
    var characters = data.classes;

    //setup elements
    document.getElementById("name").innerText = pName;

    characters.forEach(character => {
        var cType = classes[character.classType]; //warlock, hunter, titan
        var cID = character.charId; //per character ID set by Bungie
        var emblem = character.emblem; //emblem link

        //setup inventory area
        var equip = document.getElementsByClassName('equip');
        for (var i = 0; i < equip.length; i++) {
            var charDiv = document.createElement('div');
            charDiv.id = cID + "" + equip[i].parentElement.id;
            charDiv.className = "charInventory";
            charDiv.innerHTML = " ";
            equip[i].prepend(charDiv);
        }

        //setup character select button
        var charButton = document.createElement('button');
        charButton.setAttribute("onclick", `setCurrent( "${cID}","${cType}")`);
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

            /*
            {"6917529794685726238":
                {
                    "itemHash":2814122105,
                    "name":"BrayTech Researcher's Boots",
                    "icon":"https://www.bungie.net/common/destiny2_content/icons/c01038cd6b50e9ec07f2290990c3c6b7.jpg",
                    "screenshot":"https://www.bungie.net/common/destiny2_content/screenshots/2814122105.jpg",
                    "type":"Legs",
                    "location":"vault",
                    "rarity":"Legendary Leg Armor"
                }
            }
            */
            var i = 0;
            vault.forEach(item => {
                var instance = Object.keys(item)[0];
                item = item[instance];
                var location = item.location + "" + item.type;
                var icon = item.icon;
                var hash = item.itemHash;
                var name = item.name;
                var rarity = item.rarity;
                var inVault = item.location != "Vault";
                try {
                    rarity = rarity.split(" ")[0];
                } catch {
                    rarity = "undefined";
                }

                let add = document.createElement('img');
                add.setAttribute("src", icon);

                let button = document.createElement('button');
                button.setAttribute("onclick", 'transferItem(' + '"' + hash + '"' + ',"1",' + inVault + "," + '"' + instance + '"' + ',"3",' + '"' + name + '"' + ',"' + item.location + '"' + ')');
                button.appendChild(add);

                let div = document.createElement('div');
                div.setAttribute("class", "hoverwrap " + item.location + " " + i + " " + rarity);
                div.setAttribute("id", instance);

                let caption = document.createElement('div');
                caption.setAttribute("class", "hovercap");
                caption.innerText = name;

                let hover = document.createElement('div');
                hover.setAttribute("class", "darken");

                div.appendChild(button);
                div.appendChild(caption);
                div.appendChild(hover);
                document.getElementById(location).appendChild(div);
                i++;
            })
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
const swap = (instance, character, vault) => {
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
        var destination = document.getElementById(character+""+itemType);
        changeTo = character+"";
    }
    
    var elementClasses = temp
        .className
        .split(" ");
    var onclickFunction = temp
        .firstElementChild
        .getAttribute("onclick");

    //change attributes
    onclickFunction = onclickFunction.split(",");
    onclickFunction[2] = !vault;
    onclickFunction[6] = "\""+changeTo+"\")";
    onclickFunction = onclickFunction.join();

    elementClasses[1] = changeTo;
    elementClasses = elementClasses.join(" ");

    temp.firstElementChild.setAttribute("onclick", onclickFunction);
    temp.setAttribute("class", elementClasses);

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
    console.log("Sending request");
    fetch("./transfer?hash=" + hash + "&stack=" + stack + "&vault=" + vault + "&instance=" + instance + "&character=" + character + "&membership=" + membership + "&bungie=" + bungieid)
        .then(async (response) => {
            var error = await response.text();
            if (response.status == 200) {
                error = "Successfully transfered: " + name;
                swap(instance, character, vault);
            }
            console.log(error);
            message.innerHTML = JSON.stringify(error);
        }).then(async () => {
            document.getElementById(random).id += "REMOVE";
            await new Promise(r => setTimeout(r, 2500));
            document.getElementById(random + "REMOVE").remove();
        });
}