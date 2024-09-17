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
const unknownEval = (item, query) => {return true;}

// Search by name
const nameEval = (item, query) => {
    return item.name.indexOf(query) != -1;
}

// Search by type
const typeEval = (item, query) => {

}

// Search by ammo type
const ammoEval = (item, query) => {
    
}

// Search by damage type
const damageTypeEval = (item, query) => {
    
}

// Search by light level
const lightEval = (item, query) => {
    
}

// Search by rarity
const rarityEval = (item, query) => {
    
}

// Search by item family
const familyEval = (item, query) => {
    
}

// Search by breaker type
const breakerEval = (item, query) => {
    
}



const nameToFunc = (expr) => {
    if(expr == "name"){
        return nameEval;
    }else{
        return unknownEval;
    }
}

const search = (query) => {
    query = query.split(",");
    for(let i = 0; i < query.length; i++){
        query[i] = query[i].trim().toLowercase();
    }
    let matches = db.iterableList;
    query.array.forEach(expr => {
        let func = nameToFunc(expr.split(":")[0]);
        matches.forEach(item => {

        })
    });
}