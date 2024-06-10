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
        try {
            // Headers for manifest
            let header = {
                "X-API-Key": XAPI
            }
            // Get primary manifest
            let data = JSON.parse(await (await fetch(baseURL + "manifest", { headers: header })).json());

            console.log(data);
            // Go to JSON data that we actually care about
            data = data.Response.jsonWorldComponentContentPaths.en

            // Manifest endpoints we want to download
            let toDownload = ['https://www.bungie.net' + data.DestinyInventoryItemDefinition, 'https://www.bungie.net' + data.DestinyInventoryBucketDefinition, 'https://www.bungie.net' + data.DestinyStatDefinition, 'https://www.bungie.net' + data.DestinySandboxPerkDefinition];

            // Messages to print because debug
            let debugMessages = ["Inventory Item Def", "Inventory Bucket Def", "Stat Def", "Perk Def"];

            // Download and set all manifests
            for (let i = 0; i < 4; i++) {
                console.log("Downloading: " + debugMessages[i]);
                manifests[i] = JSON.parse(await ((await fetch(toDownload[i], { headers: header })).json()));
            }
            // Return success
            res(200)
        }
        // Return failure
        catch (err) { rej(err); }
    })
}

// Main function loop
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
})();
