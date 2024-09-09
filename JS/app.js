// OAuth Access & Refresh Token
let access = localStorage.getItem("access");
let refresh = localStorage.getItem("refresh");
// Last time OAuth refreshed
let refreshed = Date.now();
// Base account ID
const accID = localStorage.getItem("accountID");

// Base url for API requests
const baseURL = "https://www.bungie.net/platform/Destiny2/";

const dexie = new Dexie("test");

dexie.version(1).stores({
    manifests: `DBNAME`
});

// buckets we actually want to read
const buckets = {
    1498876634: "kinetic",
    2465295065: "energy",
    953998645: "power",
    3448274439: "helmet",
    3551918588: "gauntlets",
    14239492: "chest",
    20886954: "leg",
    1585787867: "class",
    3284755031: "subclass",
    284967655: "ships",
    4023194814: "ghosts",
    2025709351: "vehicle",
}

/*
manifests
0, Inventory Item
1, Bucket Def
2, Stat Def,
3, Perk Def
4, Item Category Def
*/
let manifests = [];

// API KEY
const XAPI = "12d813dd5ce94d8b9eab4f729e03575a";

// Fetch request basic headers and stuff
const globalReq = {
    credentials: "include",
    headers: {
        "X-API-Key": XAPI,
        "Content-Type": "application/json",
        "Authorization": "Bearer " + access
    }
}

// Membership type
let membershipType = -1;
// D2 Membership ID
let membershipID = -1;
// D2 Display name
let displayName = "";

// Full account vault/info
let db = {
    characters: { /* See character schema */ },
    vault: {/* See item schema */ }
}

// Array that is filled in whenever an item is dragged
transferData = [];

// Maps for specific information 
//(yes this is still from a manifest but it's data that I doubt will ever change and I only really need a small amount of)

// For mapping class IDs to actual class names
let classTypes = ["Titan", "Hunter", "Warlock"]

// Rarity maps
let rarity = ["What the fuck is this?", "Currency", "Common", "Uncommon", "Rare", "Legendary", "Exotic"]

// Create dictionary of character ids to time last played, sort via most recent time
let times = [];

// Indexed DB creator
const indb = (dbName, version) => {
    return new Promise((res, rej) => {
        const request = indexedDB.open(dbName, version);
        request.onsuccess = e => {
            res(e.target.result);
        };

        request.onerror = e => {
            console.log(`indexedDB error: ${e.target.errorCode}`);
        };

        request.onupgradeneeded = e => {
            console.log("Upgrade function called but I don't think I really care?");
        };
    })
}

// Fetches all manifests from Bungie.net
const refreshManifests = async () => {
    return new Promise(async (res, rej) => {
        try {
            // Headers for manifest
            let header = {
                "X-API-Key": XAPI
            }
            // Get primary manifest
            let data = await (await fetch(baseURL + "manifest", { credentials: 'include', headers: header })).json();

            // Go to JSON data that we actually care about
            data = data.Response.jsonWorldComponentContentPaths.en

            // Manifest endpoints we want to download
            let toDownload = ['https://www.bungie.net' + data.DestinyInventoryItemDefinition, 'https://www.bungie.net' + data.DestinyInventoryBucketDefinition, 'https://www.bungie.net' + data.DestinyStatDefinition, 'https://www.bungie.net' + data.DestinySandboxPerkDefinition, 'https://www.bungie.net' + data.DestinyItemCategoryDefinition];

            // Check for previous manifest names stored in localStorage
            let previousManifests = JSON.parse(localStorage.getItem("previousManifests"));
            let downloadBool = [false, false, false, false, false];
            // If previous manifests exist in localstorage check if the download URLs are the same, else we need to download all manifests
            if (previousManifests != null) {
                for (let i = 0; i < 4; i++) {
                    //check if the download URLs are the same, if they aren't they must be redownloaded
                    downloadBool[i] = previousManifests[i] != toDownload[i];
                }
            } else {
                downloadBool = [true, true, true, true];
            }

            // Messages to print because debug
            let debugMessages = ["Inventory Item Def", "Inventory Bucket Def", "Stat Def", "Perk Def", "Item Category Def"];

            // Download and set all manifests
            const manifestKeys = ["inventoryItemDef", "bucketDef", "statDef", "perkDef", "itemCategoryDef"];

            for (let i = 0; i < 5; i++) {
                // If the file does not need to be downloaded, populate the information with local data
                let key = manifestKeys[i];
                let localManifest = await dexie.manifests.get(key);
                if (!downloadBool[i] && localManifest /* if the manifest is not undefinied, no idea when this would happen but seems like a good thing to account for */) {
                    console.log("Manifest exists in local DB")
                    manifests[i] = localManifest;
                }
                // The file must be downloaded 
                else {
                    // Download the manifest 
                    console.log("Downloading: " + debugMessages[i]);
                    let data = await ((await fetch(toDownload[i])).json());
                    data.DBNAME = key;
                    console.log("Downloaded " + debugMessages[i]);

                    // Put the data into IndexedDB
                    await dexie.manifests.put(data);

                    // Assign data to manifest location
                    manifests[i] = data;
                }
            }

            // Set local storage to match currently downloaded
            localStorage.setItem("previousManifests", JSON.stringify(toDownload));

            // Return success
            res(200);
        }
        // Return failure
        catch (err) { rej(err); }
    })
}

// Refreshes access token
const refreshAccess = async () => {
    return new Promise(async (res, rej) => {
        try {
            let response = await fetch("https://d2refresh.spark952.workers.dev/?code=" + refresh);
            response = await response.json();
            access = response.access_token;
            refresh = response.refresh_token;
            localStorage.setItem("access", access);
            localStorage.setItem("refresh", refresh);
            res(200);
        } catch (err) {
            rej(err);
        }
    })
}

// Get item information by instance id
const getItem = (id, hash, response) => {
    // console.log(hash, " ", id);
    let data = response.Response.itemComponents;
    let instances = data.instances.data[id];
    let stats = data.stats.data[id];
    let perks = data.sockets.data[id];
    let perksExtra = data.reusablePlugs.data[id];
    let itemDef = manifests[0][hash];

    // Some items don't have light levels (ghosts, sparrows, ships)
    if (instances.primaryStat == undefined) {
        instances.primaryStat = { value: -1 };
    }
    // Basic Information from the manifest
    let newItem = {
        hash: hash,
        id: id,
        name: itemDef.displayProperties.name,
        flavor: itemDef.flavorText,
        icon: itemDef.displayProperties.icon,
        background: itemDef.screenshot,
        watermark: itemDef.iconWatermark,
        rarity: itemDef.inventory.tierType,
        type: itemDef.itemCategoryHashes,
        breakerType: itemDef.breakerType,
        // THIS INFORMATION IS FROM THE INSTANCES ITEM COMPONENT
        light: instances.primaryStat.value,
        element: instances.damageType,
        perks: [],
        stats: [],
        bucket: itemDef.inventory.bucketTypeHash
    }

    // Stats
    if (stats != undefined) {
        stats = stats.stats;
        let keys = Object.keys(stats);
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            let data = manifests[2][key];
            newItem.stats.push({
                name: data.displayProperties.name,
                icon: data.displayProperties.icon,
                value: stats[key].value
            })
        }
    }
    // TODO: sort keys by specific order rather than by alphabetical
    newItem.stats.sort((a, b) => ("" + a.name).localeCompare(("" + b.name)))

    let dupes = {}
    // Perks
    if (perks != undefined) {
        perks = perks.sockets;
        for (let i = 0; i < perks.length; i++) {
            let perk = perks[i];
            if (perk.isVisible && !dupes[perk.plugHash]) {
                let data = manifests[0][perk.plugHash];
                let enhanced = data.itemTypeAndTierDisplayName == "Uncommon Enhanced Trait";
                newItem.perks.push([{
                    name: data.displayProperties.name,
                    icon: data.displayProperties.icon,
                    description: data.displayProperties.description,
                    enhanced: enhanced
                }])
                dupes[perk.plugHash] = 1;
            }
        }
    }
    if (perksExtra != undefined) {
        perksExtra = perksExtra.plugs;
        let keys = Object.keys(perksExtra);
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            let extras = perksExtra[key];
            for (let j = 0; j < extras.length; j++) {
                if (extras[j].canInsert && extras[j].enabled && newItem.perks[key] != 0 && !dupes[extras[j].plugItemHash]) {
                    let data = manifests[0][extras[j].plugItemHash];
                    let enhanced = data.itemTypeAndTierDisplayName == "Uncommon Enhanced Trait";
                    if (data.itemTypeDisplayName.indexOf("Trait") != -1) {
                        newItem.perks[key].push({
                            name: data.displayProperties.name,
                            icon: data.displayProperties.icon,
                            description: data.displayProperties.description,
                            enhanced: enhanced
                        })
                        dupes[extras[j].plugItemHash] = 1;
                        // console.log(extras[j].plugItemHash)
                        // console.log(data.displayProperties.name)
                    }
                }
            }
        }
    }

    return newItem;
}

// Makes an item from the vault into an HTML element
const itemToHTML = (item) => {
    /*
    Example Item DIV
    <div id=[item instance id] title=[item name, rarity, item type] onclick=showItemInfo(item)>
        *Images layered onto each other
        <img src=[watermark]>
        <img src=[icon]>

        <div>
            *Light level and element icon
            <img src=[damage type]>
            [light level]
        </div>
    </div>
    */
    const root = "https://bungie.net";
    let tierTypes = {
        3: "Common",
        4: "Rare",
        5: "Legendary",
        6: "Exotic"
    };
    let damageTypes = {
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
    // If the item is an armor piece or not
    let armor = item.type[1] != 1;
    // Outer final element
    let element = document.createElement("div");
    // Show item stats on click in inner window
    element.addEventListener("click", () => { showItemInfo(item) });
    // Set item id as unique indentifier
    element.id = item.id;
    element.className = "item hoverwrap"

    // push watermark and push icon
    if (item.watermark) {
        element.innerHTML = `<img src=${root + item.icon}><img src=${root + item.watermark}>`;
    } else {
        element.innerHTML = `<img src=${root + item.icon}>`;
    }
    let info = document.createElement("div");
    if (item.type[1] != 50) { // If the item is not a class item
        if (!armor) {
            // Set title of element
            let title = `${item.name}`;
            if (tierTypes[item.rarity]) {
                title += `<br>${tierTypes[item.rarity]}`
            }
            if (manifests[4][item.type[0]].shortTitle) {
                title += ` ${manifests[4][item.type[2]].shortTitle}`
            }
            if (title[title.length - 1] == "s") {
                title = title.substring(0, title.length - 1);
            }
            element.title = title
            // Fill item info information
            info.innerHTML = `<img src=${damageTypes[item.element]}> ${item.light}`;
        } else {
            let title = `${item.name}`;
            if (tierTypes[item.rarity]) {
                title += `<br>${tierTypes[item.rarity]}`
            }
            if (manifests[4][item.type[0]].shortTitle) {
                title += ` ${manifests[4][item.type[0]].shortTitle}`
            }
            if (armorNames[item.type[1]]) {
                title += " " + armorNames[item.type[1]];
            }
            element.title = title
            info.innerHTML = `${item.light}`;
        }
    }
    info.className = "info"
    element.appendChild(info);
    let darken = document.createElement("div");
    darken.className = "darken"
    darken.style.pointerEvents = "none";
    element.appendChild(darken);
    element.setAttribute("draggable", "true")
    element.addEventListener("dragstart", (event) => {
        let tempStyle = document.createElement("style");
        tempStyle.id = "tempStyle"
        tempStyle.innerHTML = ".item {pointer-events: none;}"
        document.body.appendChild(tempStyle);
        let parentId = document.getElementById(item.id).parentElement.id;
        let parentIdSplit = document.getElementById(item.id).parentElement.id.split(".")
        console.log(`Transfer from: ${parentId}`)
        transferData[0] = item.hash; // Item hash (wow)
        transferData[1] = 1; // Amount of item to transfer (always one since they're all instanced)
        transferData[2] = item.id; // Item instance id
        if (parentIdSplit[0] == "equipped" || parentIdSplit[0] == "inventory") { // If we are moving from a character
            transferData[3] = parentIdSplit[2]; // Character id
        } else { // We are moving from vault
            transferData[3] = undefined;
        }
    })
    element.addEventListener("dragend", (event) => {
        document.getElementById("tempStyle").remove();
    })
    return element;
}

// Given two items compares them for sorting
const itemCompare = (a, b) => {
    let lightDiff = b.light - a.light;
    let rareDiff = b.rarity - a.rarity;
    // Depending on user setting sorts by rarity first or by power level first
    if (sort) {
        if (lightDiff != 0) {
            return lightDiff;
        }
        return rareDiff;
    } else {
        if (rareDiff != 0) {
            return rareDiff;
        }
        return lightDiff;
    }
}

const onDrop = async (id) => {
    console.log("Transfer to: ", id);
    let vault = false; //Are we transfering to (true) or from (false) the vault
    if (!transferData[3]) { // Character id is not present from dragstart event
        transferData[3] = id.split(".")[2];
    } else {
        vault = true;
    }
    if ((await transferItem(transferData[0], transferData[1], transferData[2], transferData[3], vault)) == 200) {
        if (vault) { // Move item from character to vault
            let character = transferData[3].split(".");
            if (character[0] == "inventory") {
                let inventory = db.characters[character[2]].inventory[character[1]]
                inventory.forEach(item => {
                    if (item.id == transferData[2]) {
                        db.vault[character[1]].push(item)
                        delete item
                    }
                });

            }
        } else { // Move item from vault to character
            let location = id.split(".");
            let inventory = db.vault[location[1]]
            inventory.forEach(item => {
                if (item.id == transferData[2]) {
                    db.vault[location[1]].push(item)
                    delete item
                }
            });
        }
        sortVault();
    }

}

// Sorts db and fills in page
const sortVault = () => {
    // Sort vault
    let vaultKeys = Object.keys(db.vault);
    for (let i = 0; i < vaultKeys.length; i++) {
        db.vault[vaultKeys[i]].sort(itemCompare);
    }

    // Start pushing html elements

    /* All elements where items can be stored
    1st equipped, 2nd inventory, 3rd vault
    Equipped slot is filled with most recently played character
    Inventory has different divs for each character
    Vault bucket is just the vault, singular and (generally) really big
    */
    let bucketElements = document.getElementsByClassName("bucket");

    // Clear all bucket elements
    for (let i = 0; i < bucketElements.length; i++) {
        bucketElements[i].innerHTML = "";

        // given total number of characters change column type of bucket
        let template = "";
        for (let j = 0; j < times.length; j++) {
            template += "60px 175px ";
        }
        template += "auto";
        bucketElements[i].style.gridTemplateColumns = template;
    }

    document.getElementById("characters").innerHTML = "";
    // Loop through each character, times is sorted based on which character was last logged into
    for (let i = 0; i < times.length; i++) {
        // Character zone headers
        let id = times[i].id;
        let character = db.characters[id]
        let element = document.createElement("div");
        element.innerText = classTypes[character.class];
        element.style.backgroundImage = `url("https://www.bungie.net${character.emblemBig}")`
        element.className = "selector classes"
        document.getElementById("characters").appendChild(element);


        for (let j = 0; j < bucketElements.length; j++) {
            let bucketName = bucketElements[j].id;
            let equippedElement = document.createElement("div");
            equippedElement.className = "equipped";
            equippedElement.id = `equipped.${bucketName}.${id}`
            let characterElement = document.createElement("div");
            characterElement.className = "inventory";
            characterElement.id = `inventory.${bucketName}.${id}`
            characterElement.addEventListener("drop", (event) => {
                event.preventDefault();
                onDrop(`inventory.${bucketName}.${id}`);
            })
            characterElement.addEventListener("dragover", (event) => {
                event.preventDefault();
            })

            // Fill equipped Item
            try {
                let item = itemToHTML(character.equipped[bucketName][0]);
                equippedElement.appendChild(item)
                bucketElements[j].appendChild(equippedElement)
            } catch (err) {
                console.log(`bucket id ${bucketName} does not exist in character ${id} equipped!\nError: ${err}`)
            }

            // Fill character inventory bucket
            try {
                for (let k = 0; k < character.inventory[bucketName].length; k++) {
                    characterElement.appendChild(itemToHTML(character.inventory[bucketName][k]));
                }
                bucketElements[j].appendChild(characterElement)
            } catch (err) {
                console.log(`bucket id ${bucketName} does not exist in character ${id} inventory!\nError: ${err}`)
            }

            if (i == times.length - 1) {
                let vaultElement = document.createElement("div");
                vaultElement.className = "vault"
                vaultElement.id = `vault.${bucketName}`
                vaultElement.addEventListener("drop", (event) => {
                    event.preventDefault();
                    onDrop(`vault.${bucketName}.${id}`);
                })
                vaultElement.addEventListener("dragover", (event) => {
                    event.preventDefault();
                })
                // Fill vault bucket, only needs to be done once
                try {
                    for (let k = 0; k < db.vault[bucketName].length; k++) {
                        vaultElement.appendChild(itemToHTML(db.vault[bucketName][k]));
                    }
                    bucketElements[j].appendChild(vaultElement)
                } catch (err) {
                    console.log(`bucket id ${bucketName} does not exist in vault!\nError: ${err}`)
                }
            }
        }
    }
}

// Updates db variable
const getVault = async () => {
    createNotification("Refreshing inventory!", 1500);

    // Get character information
    const response = await (await fetch(baseURL +
        `${membershipType}/Profile/${membershipID}?components=102,200,201,205,206,300,301,302,304,305,310`, globalReq)).json();
    if (response.status == 401) {
        console.log("Vault refresh failed!\nRefreshing token\nResponse for debug:" + await response.text());
        await refreshAccess();
        getVault();
    }
    // Browse to character information variable
    let data = response.Response.characters.data;
    let keys = Object.keys(data);

    // Create db character information
    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        times.push({ time: new Date(data[key].dateLastPlayed).getTime(), id: key });
        // Basic character information
        let character = {
            id: key,
            class: data[key].classType,
            equipped: {},
            loadouts: [],
            inventory: {},
            emblemSmall: data[key].emblemPath,
            emblemBig: data[key].emblemBackgroundPath
        }

        // Equipped items
        let equipped = response.Response.characterEquipment.data[key].items;
        for (let j = 0; j < equipped.length; j++) {
            if (equipped[j].itemInstanceId != undefined && buckets[equipped[j].bucketHash] != undefined) {
                try {
                    let item = getItem(equipped[j].itemInstanceId, equipped[j].itemHash, response);
                    item.bucket = buckets[equipped[j].bucketHash];
                    try {
                        character.equipped[item.bucket].push(item);
                    } catch {
                        character.equipped[item.bucket] = [];
                        character.equipped[item.bucket].push(item);
                    }
                } catch (err) {
                    console.error(equipped[j].itemInstanceId, "  ", equipped[j].itemHash, "\n", err)
                }
            }
        }

        // Loadouts
        // TEMP DISABLED 
        // character.loadouts = response.Response.characterLoadouts.data[key];

        // Inventory
        let inventory = response.Response.characterInventories.data[key].items;
        for (let j = 0; j < inventory.length; j++) {
            if (inventory[j].itemInstanceId != undefined && buckets[inventory[j].bucketHash] != undefined) {
                try {
                    let item = getItem(inventory[j].itemInstanceId, inventory[j].itemHash, response);
                    item.bucket = buckets[inventory[j].bucketHash];
                    try {
                        character.inventory[item.bucket].push(item);
                    } catch {
                        character.inventory[item.bucket] = [];
                        character.inventory[item.bucket].push(item);
                    }
                } catch (err) {
                    console.error(inventory[j].itemInstanceId, "  ", inventory[j].itemHash, "\n", err)
                }
            }
        }
        // Sort iventories
        let inventoryKeys = Object.keys(character.inventory);
        for (let j = 0; j < inventoryKeys.length; j++) {
            character.inventory[inventoryKeys[j]].sort(itemCompare);
        }

        // Push character object to DB
        db.characters[key] = character;
    }

    times.sort((a, b) => { return b.time - a.time; });

    // Create db vault informationn
    let vault = response.Response.profileInventory.data.items;
    for (let i = 0; i < vault.length; i++) {
        if (vault[i].itemInstanceId != undefined) {
            try {
                let item = getItem(vault[i].itemInstanceId, vault[i].itemHash, response);
                item.bucket = buckets[item.bucket];
                try {
                    db.vault[item.bucket].push(item);
                } catch {
                    db.vault[item.bucket] = [];
                    db.vault[item.bucket].push(item);
                }
            } catch {
                // console.log(vault[i].itemInstanceId, "  ", vault[i].itemHash)
            }
        }
    }

    sortVault();
}

// How I want item transfer to actually work

/**
 * Drag drop item,
 * starting zone is determined by class name of parent element
 * character id is then determined by class name of whichever element relates to the character
 */

/**Transfers an item
 * itemHash the hash of the item being transfered, don't ask me why they need this when they have the instance id
 * stackSize the amount of an item being transfered, generally just 1
 * instance the instance id
 * character the id of the character being referenced 
 * toVault is it going to the vault from a character (true) or going from the vault to a character (false)
 * */
const transferItem = async (itemHash, stackSize, instance, character, toVault) => {
    return new Promise(async (res, rej) => {
        let data = globalReq;
        data.method = "POST";
        data.body = JSON.stringify({
            "itemReferenceHash": itemHash,
            "stackSize": stackSize,
            "itemId": instance,
            "transferToVault": toVault,
            "characterId": character,
            "membershipType": membershipType
        });

        let response = await fetch(baseURL + "Actions/Items/TransferItem/", data)
        if (response.status == 401) {
            console.log("Transfer item failed!\nRefreshing token\nResponse for debug:" + await response.text());
            await refreshAccess();
            transferItem(itemHash, stackSize, toVault, instance, character);
        }
        else if (response.status == 200) {
            res(200)
        } else {
            console.error("Something funky happened! (transferItem)\n", JSON.stringify(response), response)
            rej(500)
        }
    });
}

/**Equips an item
 * instance instanceid of desired item to equip
 * character character to equip to
 */
const equipItem = async (instance, character) => {
    let data = globalReq;
    data.method = "POST"
    data.body = json.stringify({
        "itemId": instance,
        "characterId": character,
        "membershipType": membershipType
    });

    let response = await fetch(baseURL + "Actions/Items/EquipItem/", data)
    if (response.status == 401) {
        console.log("Transfer item failed!\nRefreshing token\nResponse for debug:" + await response.text());
        await refreshAccess();
        equipItem(instance, character);
    }
}
// Main function start
(async function () {
    createNotification("Downloading latest information from Bungie!", 1000);
    let gotManifest = false;
    while (!gotManifest) {
        // Get manifests
        if (await refreshManifests() == 200) {
            createNotification("Downloaded latest information from Bungie!", 1500);
            gotManifest = true;
        } else {
            createNotification("Failed trying again in three seconds!", 3000);
            await new Promise(r => setTimeout(r, 3000));
        };
    }

    // Fetch Destiny 2 account information & set all relevant variables
    let linkedProfiles = {}
    try {
        linkedProfiles = await (await fetch(baseURL + "254/Profile/" + accID + "/LinkedProfiles", globalReq)).json();
    } catch {
        await refreshAccess()
        linkedProfiles = await (await fetch(baseURL + "254/Profile/" + accID + "/LinkedProfiles", globalReq)).json();
    }
    linkedProfiles = linkedProfiles.Response.profiles[0];
    membershipID = linkedProfiles.membershipId;
    membershipType = linkedProfiles.membershipType;
    displayName = linkedProfiles.displayName;

    // Fill vault and character information
    await getVault();
})();
