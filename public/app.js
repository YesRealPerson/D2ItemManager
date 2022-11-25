/*TODO AFTER MAIN FUNCTIONALITY

- :)

*/

//Destiny 2 ID
var d2id;

//Bungie ID
var bungieid;

//Profile Name
var pName;

//Profile vault
var vault;

//Profile oauth
var oAuth;

//Class list
var classes = ["Titan", "Hunter", "Warlock"];

//Current character
var currentChar = "";

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
        pName = data.name;

        selectorSetup(data);
    });

//set Vault
refreshVault();

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