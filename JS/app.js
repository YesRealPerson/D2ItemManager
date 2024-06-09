// OAuth Access & Refresh Token
const access = localStorage.getItem("access");
const refresh = localStorage.getItem("refresh");
// Base account ID
const accID = localStorage.getItem("accountID");

// Base url for API requests
const baseURL = "https://bungie.net/platform/Destiny2/";

/*
manifests
0, Inventory Item
1, Bucket Def
2, Stat Def,
3, Perk Def
*/
let manifests = [];

const XAPI = "12d813dd5ce94d8b9eab4f729e03575a";

const refreshManifests = async () => {
    return new Promise(async (res, rej) => {
        try{
            // Get our manifest
            let data = JSON.parse(await (await fetch(baseURL + "manifest", {headers: {"X-API-Key": XAPI}})).json());
            console.log(data);
            data = data.Response.jsonWorldComponentContentPaths.en
            let toDownload = ['https://www.bungie.net' + data.DestinyInventoryItemDefinition, 'https://www.bungie.net' + data.DestinyInventoryBucketDefinition, 'https://www.bungie.net' + data.DestinyStatDefinition, 'https://www.bungie.net' + data.DestinySandboxPerkDefinition];
            for(let i = 0; i < 4; i++){
                manifests[i] = JSON.parse(await ((await fetch(toDownload[i], {headers: {"X-API-Key": XAPI}})).json()));
            }
            res(200)
        }catch(err){ rej(err); }
    })
}

// Main function loop
(async function (){
    // Get manifests
    await refreshManifests();
})();
