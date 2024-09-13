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