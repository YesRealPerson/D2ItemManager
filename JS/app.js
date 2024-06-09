// OAuth Access & Refresh Token
const access = localStorage.getItem("access");
const refresh = localStorage.getItem("refresh");
// Base account ID
const accID = localStorage.getItem("accountID");

// Base url for API requests
const baseURL = "https://bungie.net/platform/Destiny2/";

// manifests
let InventoryItem = {};
let InventoryBucket = {};
let StatDefinition = {};
let PerkDefinition = {};

const refreshManifests = async () => {
    return new Promise(async (res, rej) => {
        try{
            // Get our manifest
            let manifest = JSON.parse(await (await fetch(baseURL + "manifest")).json());
            let url = "https://bungie.net/";
            console.log(manifest);
            res(200)
        }catch(err){ rej(err); }
    })
}

// Main function loop
(async function (){
    // Get manifests
    await refreshManifests();
})();
