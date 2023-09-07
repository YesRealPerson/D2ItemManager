/*TODO AFTER MAIN FUNCTIONALITY

- create loadouts

*/

//Destiny 2 ID
var d2id;

//Bungie ID
var bungieid;

//Membership type
var membershipType;

//Profile Name
var pName;

//Profile vault
var vault;

//Profile tags
var tags;

//Profile oauth
var oAuth;

//Class list
var classes = ["Titan", "Hunter", "Warlock", "Unknown"];

//breaker links
let breakers = ["", "https://www.bungie.net/common/destiny2_content/icons/DestinyBreakerTypeDefinition_07b9ba0194e85e46b258b04783e93d5d.png", "https://www.bungie.net/common/destiny2_content/icons/DestinyBreakerTypeDefinition_da558352b624d799cf50de14d7cb9565.png", "https://www.bungie.net/common/destiny2_content/icons/DestinyBreakerTypeDefinition_825a438c85404efd6472ff9e97fc7251.png"];

//breaker names
let breakerNames = ["", "Anti-Barrier", "Overload Rounds", "Unstoppable Rounds"];

//Current character
var currentChar = "";

//sorting priority
var powerFirst = false;

//where item is from
var from = "";

//If double transfer
var characterTransfer = false;

//if user wants color bars
var colorBars = false;

//Variables for current transfer

var transferData = [null, null, null, null, null, null];

//get query from URL
const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
});

//MAIN SETUP

//set Bungie ID
bungieid = params.user;
fetch("/users/" + bungieid + ".profile.json")
    .then((response) => {
        //if profile exists
        //Really shouldn't be possible for it to not exist but whatever
        if (response.ok) {
            return response.text();
        } else {
            throw new Error("Profile JSON does not exist for " + bungieid);
        }
    })
    .then((data) => {
        //set variables
        data = JSON.parse(data);
        d2id = data.membershipId;
        membershipType = data.membershipType;
        pName = data.name;

        selectorSetup(data);
    }).then(() => {
        //set Vault
        internalVaultRefresh();
    })

//set oAuth
fetch("./users/" + bungieid + ".oauth.json")
    .then((response) => {
        //if oAuth exists
        //Really shouldn't be possible for it to not exist but whatever
        if (response.ok) {
            return response.text();
        } else {
            throw new Error("Profile JSON does not exist for " + bungieid);
        }
    })
    .then((data) => {
        oAuth = JSON.parse(data);
    });

//setup vault event listeners
var vaults = ["Kinetic", "Energy", "Power", "Helmet", "Gauntlets", "Chest", "Leg", "Class", "Ghost", "Ships", "Vehicle"];
vaults.forEach(type => {
    var element = document.getElementById("Vault." + type);
    element.className += " glowHover";
    element.addEventListener("dragover", (event) => {
        // prevent default to allow drop
        event.preventDefault();
        // console.log("above vault");
    });
    element.addEventListener("drop", (event) => {
        event.preventDefault();
        document.getElementById("tempStyle").remove();
        var target = event.target.id.split(".");
        setCurrent(target[0]);
        if (target[0] != from) {
            transferItem(transferData[0], 1, transferData[1], transferData[2], transferData[3], transferData[4], transferData[5]);
        }
    });
});