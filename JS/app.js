// OAuth Access & Refresh Token
let access = localStorage.getItem("access");
let refresh = localStorage.getItem("refresh");
// Base account ID
const accID = localStorage.getItem("accountID");

// Base url for API requests
const baseURL = "https://www.bungie.net/platform/Destiny2/";

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
    vault: {/* See item schema */}
}

// Maps for specific information 
//(yes this is still from a manifest but it's data that I doubt will ever change and I only really need a small amount of)

// For mapping class IDs to actual class names
let classTypes = ["Titan", "Hunter", "Warlock"]

// Rarity maps
let rarity = ["What the fuck is this?", "Currency", "Common", "Uncommon", "Rare", "Legendary", "Exotic"]

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

            // Messages to print because debug
            let debugMessages = ["Inventory Item Def", "Inventory Bucket Def", "Stat Def", "Perk Def", "Item Category Def"];

            // Download and set all manifests
            for (let i = 0; i < 4; i++) {
                console.log("Downloading: " + debugMessages[i]);
                manifests[i] = JSON.parse(await ((await fetch(toDownload[i], { credentials: 'include', headers: header })).json()));
            }
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

// Updates vault variable
const getVault = async () => {
    // buckets we actually want to read
    let buckets = {
        1498876634: "kinetic",
        2465295065: "energy",
        953998645: "power",
        3448274439: "helmet",
        3551918588: "gauntlets",
        14239492: "chest",
        20886954: "leg",
        1585787867: "class",
        3284755031: "subclass",
        284967655: "Ships",
        4023194814: "Ghosts",
        2025709351: "vehicle",
    }

    // Get item information by instance id
    const getItem = (id, hash) => {
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

        // Perks
        if (perks != undefined) {
            perks = perks.sockets;
            for (let i = 0; i < perks.length; i++) {
                let perk = perks[i];
                if (perk.isVisible) {
                    let data = manifests[0][perk.plugHash];
                    newItem.perks.push([{
                        name: data.displayProperties.name,
                        icon: data.displayProperties.icon,
                        description: data.displayProperties.description
                    }])
                } else {
                    newItem.perks.push([]);
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
                    if (extras[j].canInsert && extras[j].enabled && newItem.perks[key] != 0) {
                        let data = manifests[0][extras[j].plugItemHash];
                        if (data.itemTypeDisplayName.indexOf("Trait") != -1) {
                            newItem.perks[key].push({
                                name: data.displayProperties.name,
                                icon: data.displayProperties.icon,
                                description: data.displayProperties.description
                            })
                            console.log(extras[j].plugItemHash)
                            console.log(data.displayProperties.name)
                        }
                    }
                }
            }
        }

        return newItem;
    }

    // Makes an item from the vault into an HTML element
    const itemToHTML = (item) => {
        let tierTypes = {
            3: "Common",
            4: "Rare",
            5: "Legendary",
            6: "Exotic" 
        };
        let armor = item.types[1] == 1;
        let element = document.createElement("div");
        element.id = item.id;
        if(!armor){
            element.title = `${item.name}\n${tierTypes[item.tierType]} ${manifests[4][item.types[2]]}`;
        }else{
            element.title = `${item.name}\n${tierTypes[item.tierType]} ${manifests[4][item.types[0]]}`;
        }
    }

    // Get character information
    // Browse to character information variable
    let data = response.Response.characters.data;
    let keys = Object.keys(data);

    // Create dictionary of character ids to time last played, sort via most recent time
    let times = [];

    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        times.push({ time: new Date(data[key].dateLastPlayed).getTime(), id: key });
        // Basic character information
        let character = {
            id: key,
            class: data[key].classType,
            equipped: [],
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
                    let item = getItem(equipped[j].itemInstanceId, equipped[j].itemHash);
                    item.bucket = buckets[equipped[j].bucketHash];
                    character.equipped.push(item)
                } catch {
                    console.error(inventory[j].itemInstanceId, "  ", inventory[j].itemHash)
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
                    let item = getItem(inventory[j].itemInstanceId, inventory[j].itemHash);
                    item.bucket = buckets[inventory[j].bucketHash];
                    character.inventory[inventory[j].itemInstanceId] = item
                } catch {
                    console.error(inventory[j].itemInstanceId, "  ", inventory[j].itemHash)
                }
            }
        }

        // Push character object to DB
        db.characters[key] = character;
    }

    times.sort((a, b) => { return b.time - a.time; });

    // Vault
    let vault = response.Response.profileInventory.data.items;
    for (let i = 0; i < vault.length; i++) {
        if (vault[i].itemInstanceId != undefined) {
            try {
                let item = getItem(vault[i].itemInstanceId, vault[i].itemHash);
                item.bucket = buckets[vault[i].bucketHash];
                db.vault[vault[i].itemInstanceId] = item;
            } catch {
                console.log(vault[i].itemInstanceId, "  ", vault[i].itemHash)
            }
        }
    }

    // Write to json file for testing purposes
    fs.writeFileSync("./test/test.json", JSON.stringify(db));

    // Start pushing html elements

    /* All elements where items can be stored
    1st equipped, 2nd inventory, 3rd vault
    Equipped slot is filled with most recently played character
    Inventory has different divs for each character
    Vault bucket is just the vault, singular and (generally) really big
    */
    let bucketElements = document.getElementsByClassName("bucket");

    for (let i = 0; i < times.length; i++) {
        let character = db.characters[id];
        // Character zone headers
        let id = times[i].id;
        let element = document.createElement("div");
        element.innerText = classTypes[character.class];
        element.style.backgroundImage = `url("https://www.bungie.net + ${character.emblemBig}")`
        document.getElementById("characters").appendChild(element);

        for(let j = 0; j < bucketElements.length; j++){
            let current = bucketElements[j];
            // If this is the first character (most recently logged in) populate equipped buckets
            if(i == 0){
                let equippedElement = current.firstElementChild;
                equippedElement.innerHTML = "";
                // Create item div and push to equipped element
                for(let k = 0; k < character.equipped.length; k++){
                    let item = character.equipped[k];
                    equippedElement.appendChild(itemToHTML(item));
                }
            }
        }
    }
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
 * toVault is it going to the vault from a character (true) or going from the vault to a character (false)
 * instance the instance id
 * character the id of the character being referenced 
 * */
const transferItem = async (itemHash, stackSize, toVault, instance, character) => {
    let data = globalReq;
    data.data = {
        "itemReferenceHash": itemHash,
        "stackSize": stackSize,
        "itemId": instance,
        "transferToVault": toVault,
        "characterId": character,
        "membershipType": membershipType
    };

    let response = await fetch(baseURL + "Actions/Items/TransferItem/", data)
    if (response.status == 401) {
        console.log("Transfer item failed!\nRefreshing token\nResponse for debug:" + await response.text());
        await refreshAccess();
        transferItem(itemHash, stackSize, toVault, instance, character);
    }
}

/**Equips an item
 * instance instanceid of desired item to equip
 * character character to equip to
 */
const equipItem = async (instance, character) => {
    let data = globalReq;
    data.data = {
        "itemId": instance,
        "characterId": character,
        "membershipType": membershipType
    };

    let response = await fetch(baseURL + "Actions/Items/EquipItem/", data)
    if (response.status == 401) {
        console.log("Transfer item failed!\nRefreshing token\nResponse for debug:" + await response.text());
        await refreshAccess();
        equipItem(instance, character);
    }
}
// Main function start
(async function () {
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
    let linkedProfiles = await (await fetch(baseURL + "254/Profile/" + accID + "/LinkedProfiles", globalReq)).json();
    linkedProfiles = linkedProfiles.Response.profiles[0];
    membershipID = linkedProfiles.membershipId;
    membershipType = linkedProfiles.membershipType;
    displayName = linkedProfiles.displayName;

    // Fill vault and character information
    await getVault();
})();
