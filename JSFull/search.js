/*
Item schema
{
    hash: base item hash,
    id: item instance id,
    name: item name,
    flavor: item flavor text,
    icon: item icon url,
    background: item background url,
    watermark: item watermark url,
    rarity: 3: Common, 4: Rare, 5: Legendary, 6: Exotic
    type: 3 length array that maps to manifest[4],
    breakerType: none, Anti-Barrier, Overload Rounds, Unstoppable Rounds
    light: light level
    element: kinetic, arc, solar, void, none, stasis, strand
    perks: [{
        name: perk name,
        icon: perk url,
        description: self explanatory,
        enhanced: boolean, self explanatory
    }],
    stats: [{
        name: stat name,
        value: self explanatory
    }],
    bucket: itemDef.inventory.bucketTypeHash
    }
*/

// User called a bad function
const unknownEval = (item, query) => { return true; }

// Search by name
const nameEval = (item, query) => {
    return item.name.toLowerCase().indexOf(query) != -1;
}

// Search by type
const typeEval = (item, query) => { // MAP COMMON SHORTENINGS LATER i.e. SMG -> submachine gun
    let armor = item.type[1] != 1; // If the item is an armor piece
    if (armor) {
        return manifests[4][item.type[0]].shortTitle.toLowerCase().indexOf(query) != -1;
    } else {
        return manifests[4][item.type[2]].shortTitle.toLowerCase().indexOf(query) != -1;
    }
}

// Search by ammo type
const ammoEval = (item, query) => {
    let ammoTypes = ["none", "primary", "special", "heavy", "none"];
    return ammoTypes[item.ammo].indexOf(query) != -1;
}

// Search by damage type
const damageTypeEval = (item, query) => {
    let damageTypes = { 1: "kinetic", 2: "arc", 3: "solar", 4: "void", 5: "", 6: "stasis", 7: "strand" };
    return damageTypes[item.element].indexOf(query) != -1;
}

// Search by light level
const lightEval = (item, query) => {
    try {

        switch (query[0]) {
            case ">":
                return item.light > +query.substring(1);
            case "<":
                return item.light < +query.substring(1);
            case "=":
                return item.light == +query.substring(1);
            default:
                return false;
        }
    } catch {
        return false;
    }
}

// Search by rarity
const rarityEval = (item, query) => {
    let tierTypes = {
        3: "common",
        4: "rare",
        5: "legendary",
        6: "exotic"
    };
    return tierTypes[item.rarity].indexOf(query != -1);
}

// Search by breaker type
const breakerEval = (item, query) => {
    let breakerNames = ["", "anti-barrier", "overload rounds", "unstoppable rounds"];
    return breakerNames[item.breakerType].indexOf(query) != -1;
}



const nameToFunc = (expr) => {
    switch (expr) {
        case "name":
            return nameEval;
        case "type":
            return typeEval
        case "ammo":
            return ammoEval;
        case "damage":
            return damageTypeEval;
        case "light":
            return lightEval;
        case "rarity":
            return rarityEval;
        case "champion":
            return breakerEval;
        default:
            return unknownEval;
    }
}

const search = (query) => {
    // Make deep copy of full item list
    let matches = JSON.parse(JSON.stringify(db.iterableList));
    matches.forEach(item => {
        document.getElementById(item.id).setAttribute("style", "")
    })
    try {
        // Split full search into individual queries
        query = query.split(",");
        // Trim and put each query into lowercase for comparison
        for (let i = 0; i < query.length; i++) {
            console.log(typeof query[i])
            console.log(query[i])
            query[i] = query[i].trim().toLowerCase();
        }
        // Loop through each query
        query.forEach(expr => {
            // Get a function for the query type
            let func = nameToFunc(expr.split(":")[0]);
            // Evaluate every item for that search
            for (let i = matches.length - 1; i >= 0; i--) {
                // If the item matches the query (it returned true)
                if (func(matches[i], expr.split(":")[1])) {
                    // Cut element from array
                    matches = matches.slice(0, i).concat(matches.slice(i + 1))
                }
            }
        });

        // Loop through all remaining elements and grey them out
        matches.forEach(item => {
            try {
                document.getElementById(item.id).setAttribute("style", "--opacity: 0.5")
            } catch {
                console.log(item)
            }
        })
    }
    // In case the user passes an invalid search that causes an error
    catch (err) {
        console.log(err);
        matches.forEach(item => {
            document.getElementById(item.id).setAttribute("style", "")
        })
    }
}