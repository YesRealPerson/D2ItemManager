// Import libraries
const express = require('express');
const axios = require('axios');
const https = require('https');
const fs = require('fs');
const qs = require('qs');
const path = require('path');
const { getSystemErrorName } = require('util');

const key = fs.readFileSync('./key.pem');
const cert = fs.readFileSync('./cert.pem');

require('dotenv').config()
const bAuth = process.env.BASIC;
const XAPIKey = process.env.XAPI;

//retrieve itemManifest
let manifestPromise = function getManifest() {
  return new Promise((resolve, reject) => {
    var config = {
      method: 'get',
      url: 'https://www.bungie.net/platform/destiny2/manifest',
    };

    axios(config)
      .then(function (response) {
        var data = JSON.stringify(response.data);
        var obj = JSON.parse(data);
        var url = obj.Response.jsonWorldComponentContentPaths.en.DestinyInventoryItemDefinition;
        var filename = url.split("/").at(-1);
        //check if manifest up-to-date
        if (!fs.existsSync('./public/' + filename)) {
          var c = {
            method: 'get',
            url: 'https://www.bungie.net' + url,
          };
          axios(c)
            .then(function (response) {
              var manifest = JSON.stringify(response.data);
              //write manifest
              console.log("downloading manifest");
              // console.log(__dirname+"/public/"+filename);
              fs.writeFileSync(__dirname + "/public/" + filename, manifest);
              //Say success
              console.log("downloaded manifest");
              resolve(filename);
            })
        }
        else {
          resolve(filename);
        }
      })
      .catch(function (error) {
        reject("Failed to get manifest");
      });
  });
}

//manifest download successful
manifestPromise().then((res) => {
  //read downloaded file
  var itemManifest = JSON.parse(fs.readFileSync('./public/' + res));
  console.log("Manifest version: " + res);
  const app = express();
  app.use(express.static(path.join(__dirname, 'public')));
  const server = https.createServer({ key: key, cert: cert }, app);

  //serve default page
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/login.html'));
  });

  //serve application page
  app.get('/app', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/app.html'));
  });

  //refresh vault (calls getVault)
  app.get("/refresh", async (req, res) => {
    const x = await getVault(req.query.d2id, req.query.bungieid);
    res.status(200).send(x);
  });

  //OAUTH Login
  app.get("/oauth/redirect", (req, res) => {

    //header data
    var data = qs.stringify({
      'grant_type': 'authorization_code',
      'code': req.query.code
    });

    //config
    var config = {
      method: 'post',
      url: 'https://www.bungie.net/Platform/App/OAuth/Token/',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + bAuth,
      },
      data: data
    };

    //request
    axios(config).then(function (response) {
      //get time of request 
      //oauth code decays after 60 minutes (3600 seconds)
      //refresh code decays after 90 days (7776000 seconds) 
      var d = new Date().getTime();
      d = d / 1000;
      var name = response.data.membership_id;
      var data = JSON.stringify({
        'user': name,
        'access': response.data.access_token,
        'accessExpire': response.data.expires_in + d,
        'refresh': response.data.refresh_token,
        'refreshExpire': response.data.refresh_expires_in + d,
        'code': req.query.code
      });

      //write OAUTH response data
      fs.writeFileSync('./public/users/' + name + '.oauth.json', data);

      //get Destiny ID
      getName(name)
        //get vault and characters
        .then(function () {
          var destinyID = JSON.parse(fs.readFileSync("./public/users/" + name + ".profile.json")).membershipId;
          getVault(destinyID, name);
          getCharacters(destinyID, name);
        })
        .then(function () {
          res.redirect('/app?user=' + name);
        })
    })
      .catch(function (error) {
        reject(error);
      });
    //end of request
  });

  //Transfer item
  app.get("/transfer", async (req, res) => {
    var keys = Object.keys(req.query);
    if (!(keys.includes("hash") && keys.includes("stack") && keys.includes("vault") && keys.includes("instance") && keys.includes("character") && keys.includes("membership") && keys.includes("bungie"))) {
      console.log("missing params for transfer items");
      res.status(400).send("Missing parameters");
    } else {
      await transferItem(req.query.hash, req.query.stack, req.query.vault, req.query.instance, req.query.character, req.query.membership, req.query.bungie)
        .then(response => {
          res.status(200).send("Item transfer successful.");
        })
        .catch(error => {
          var message = "";
          try{
            message = error.response.data.Message;
          }catch {
            message = "You may need to relogin";
          }
          res.status(400).send(message);
        });
    }
  });

  //gets general information from item hash
  const lookup = (id) => {
    return itemManifest[id];
  }

  //gets Destiny ID and username
  const getName = (bungie) => {
    return new Promise(function (resolve, reject) {
      var config = {
        method: 'get',
        url: 'https://bungie.net/platform/Destiny2/254/Profile/' + bungie + '/LinkedProfiles',
        headers: {
          'X-API-Key': XAPIKey
        }
      };

      axios(config).then(function (response) {
        var data = JSON.stringify({
          "membershipId": response.data.Response.profiles[0].membershipId,
          "name": response.data.Response.profiles[0].displayName
        });
        fs.writeFileSync("./public/users/" + bungie + '.profile.json', data);
        resolve(data);
      })
        .catch(function (error) {
          reject(error);
        });
    })
  }

  //gets vault for player
  const getVault = async (d2id, bungieid) => {
    return new Promise((resolve, reject) => {
      console.log("Get Vault for " + bungieid);
      var config = {
        method: 'get',
        url: 'https://www.bungie.net/Platform/Destiny2/3/profile/' + d2id + '/?components=102',
        headers: {
          'X-API-Key': XAPIKey
        }
      };

      axios(config)
        .then(function (response) {
          //get profile inventory from response
          var data = response.data.Response.profileInventory.data;
          //items array
          var equipables = [];
          //loop through all items in data
          for (var i = 0; i < data.items.length; i++) {
            //get bucket hash
            var bucketHash = data.items[i].bucketHash;
            //check if item is of equipable item type (weapon/armor)
            if (bucketHash === 138197802) {
              //get item instance id (specific i.e. MY fatebringer)
              var itemInstanceId = data.items[i].itemInstanceId;
              //get item hash (general item i.e. fatebringer the gun)
              var itemHash = data.items[i].itemHash;
              //get item info
              var obj = lookup(itemHash);
              //get rarity and type of item (i.e.  Legendary Leg Armor)
              var rarity = obj.itemTypeAndTierDisplayName;
              //get item type
              var type = obj.inventory.bucketTypeHash;
              //change item type from hash to string
              switch (type) {
                case 1498876634:
                  type = "Kinetic";
                  break;
                case 2465295065:
                  type = "Energy";
                  break;
                case 953998645:
                  type = "Power";
                  break;
                case 3448274439:
                  type = "Helmet";
                  break;
                case 3551918588:
                  type = "Gauntlets";
                  break;
                case 14239492:
                  type = "Chest";
                  break;
                case 20886954:
                  type = "Legs";
                  break;
                case 1585787867:
                  type = "Class";
                default:
                  type = "Unknown";
              }
              //get name of object (i.e Crest of Alpha Lupi)
              var name = obj.displayProperties.name;
              //get applied ornament
              var override = data.items[i].overrideStyleItemHash;
              //if ornament exists
              if (override != undefined) {
                //set obj to ornament
                obj = (lookup(override));
              }
              //set url of icon of item
              var icon = "https://www.bungie.net" + obj.displayProperties.icon;
              //set url of screenshot of item
              var screenshot = "https://www.bungie.net" + obj.screenshot;
              //create JSON object for item
              var push = { [itemInstanceId]: { "itemHash": itemHash, "name": name, "icon": icon, "screenshot": screenshot, "type": type, "location": "Vault", "rarity": rarity } };
              //push to items array
              equipables.push(push);
            }
          }
          //get player inventory
          var config = {
            method: 'get',
            url: 'https://www.bungie.net/Platform/Destiny2/3/profile/' + d2id + '/?components=201',
            headers: {
              'X-API-Key': XAPIKey
            }
          };

          axios(config)
            .then(function (response) {
              //get each character inventory
              var charInvens = response.data.Response.characterInventories.data;
              //loop through each inventory
              for (var key in charInvens) {
                //get individual inventory
                data = charInvens[key];
                //loop through all items in inventory
                for (var i = 0; i < data.items.length; i++) {
                  //get bucket hash
                  var bucketHash = data.items[i].bucketHash;
                  //check if item is armor or weapon
                  var bucketTypes = [1498876634, 2465295065, 953998645, 3448274439, 3551918588, 14239492, 20886954, 1585787867]
                  if (bucketTypes.includes(bucketHash)) {
                    var itemInstanceId = data.items[i].itemInstanceId;
                    var itemHash = data.items[i].itemHash;
                    var obj = (lookup(itemHash));
                    var rarity = obj.itemTypeAndTierDisplayName;
                    var type = obj.inventory.bucketTypeHash;
                    switch (type) {
                      case 1498876634:
                        type = "Kinetic";
                        break;
                      case 2465295065:
                        type = "Energy";
                        break;
                      case 953998645:
                        type = "Power";
                        break;
                      case 3448274439:
                        type = "Helmet";
                        break;
                      case 3551918588:
                        type = "Gauntlets";
                        break;
                      case 14239492:
                        type = "Chest";
                        break;
                      case 20886954:
                        type = "Legs";
                        break;
                      case 1585787867:
                        type = "Class";
                    }
                    var override = data.items[i].overrideStyleItemHash;
                    var name = obj.displayProperties.name;
                    if (override != undefined) {
                      obj = (lookup(override));
                    }
                    var icon = "https://www.bungie.net" + obj.displayProperties.icon;
                    var screenshot = "https://www.bungie.net" + obj.screenshot;
                    var push = { [itemInstanceId]: { "itemHash": itemHash, "name": name, "icon": icon, "screenshot": screenshot, "type": type, "location": key, "rarity": rarity } };
                    equipables.push(push);
                  }
                }
              }
              var vault = { "data": equipables };
              fs.writeFile("./public/users/" + bungieid + '.vault.json', JSON.stringify(vault), (err) => {
                if (err) reject("Error: " + err);
                else resolve(vault);
              })
            });
          //TODO: get equipped items component 205
          //Maybe not idk
        })
        .catch(function (error) {
          console.log(error);
          reject("Error: " + error);
        });
    })

  }

  //gets associated characters for a player
  const getCharacters = (d2id, bungieid) => {
    console.log("Get Characters for " + bungieid);
    var config = {
      method: 'get',
      url: 'https://bungie.net/platform/Destiny2/3/Profile/' + d2id + '/?components=200',
      headers: {
        'X-API-Key': XAPIKey
      }
    };

    axios(config)
      .then(function (response) {
        //read data JSON
        var data = response.data;
        //read current profile data for ID
        var endJSON = JSON.parse(fs.readFileSync("./public/users/" + bungieid + '.profile.json'));
        //get character array key
        var chars = Object.keys(data.Response.characters.data);
        //initialize character array
        var charsArray = [];
        //add character information to array
        chars.forEach((char) => {
          charsArray.push({
            "classType": data.Response.characters.data[char].classType,
            "charId": data.Response.characters.data[char].characterId,
            "emblem": data.Response.characters.data[char].emblemBackgroundPath,
          });
        });
        //write character array to profile JSON
        endJSON.classes = charsArray;
        //write new profile JSON to disk
        fs.writeFileSync("./public/users/" + bungieid + '.profile.json', JSON.stringify(endJSON));
      })
      .catch(function (error) {
        console.log("GetCharacters error")
      });
  }

  //Checks and refreshes oauth
  const refreshToken = (oauth) => {
    return new Promise((resolve, reject) => {
      console.log("Checking token");
      var d = new Date().getTime() + 1000;
      d = d / 1000;
      if (oauth.accessExpire < d) {
        if (oauth.refreshExpire < d) {
          //refresh token expired
          console.log("reject madge");
          reject("Re-Login Required");
        } else {
          console.log("Refreshing token");
          //Use refresh token
          //header data
          var data = qs.stringify({
            'grant_type': 'refresh_token',
            'refresh_token': oauth.refresh
          });

          //config
          var config = {
            method: 'post',
            url: 'https://www.bungie.net/platform/app/oauth/token/',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': 'Basic ' + bAuth
            },
            data: data
          };

          //send request
          console.log("sending refresh request");
          axios(config)
            .then(response => {
              var d = new Date().getTime();
              d = d / 1000;
              var data = JSON.stringify({
                'user': response.data.membership_id,
                'access': response.data.access_token,
                'accessExpire': response.data.expires_in + d,
                'refresh': response.data.refresh_token,
                'refreshExpire': response.data.refresh_expires_in + d,
                'code': oauth.code
              });
              fs.writeFile("./public/users/" + oauth.user + ".oauth.json", data, err => {
                if (err) {
                  console.log("reject widePeepoSad");
                  reject(err);
                } else {
                  resolve(response);
                }
              });
            })
            .catch(error => {
              console.log("reject Sadge");
              reject(error);
            });
        }
      } else {
        resolve(200);
      }
    });
  }

  //Transfers an item
  const transferItem = async (itemReferenceHash, stackSize, vault, instance, character, membershipType, bungie) => {
    /*
    Request body parameters:
    itemReferenceHash
    stackSize
    transferToVault (true means going to vault)
    itemId (instance ID)
    characterId   (if going to vault, 
                          id is starting location id, 
                          if going into charcter id is destination id)
    membershipType

    Take in oauth json
    Refresh oauth token if expired
    */
    return new Promise(async (resolve, reject) => {

      fs.readFile("./public/users/" + bungie + ".oauth.json", async (err, data) => {
        if (err) {
          console.log("reject sadge");
          reject(err);
        }
        var oauth = JSON.parse(data);

        await refreshToken(oauth)
          .then((response) => {
            if(response != 200){
              fs.readFile("./public/users/" + bungie + ".oauth.json", async (err, data) => {
                if (err) {
                  console.log("reject pog");
                  reject(err);
                }
                oauth = JSON.parse(data);
              });
            }
            console.log("Transfering Item for: "+bungie);
            //transfer item

            var data = JSON.stringify({
              "itemReferenceHash": itemReferenceHash,
              "stackSize": stackSize,
              "transferToVault": vault,
              "itemId": instance,
              "characterId": character,
              "membershipType": membershipType
            });

            var config = {
              method: 'post',
              url: 'https://www.bungie.net/Platform/Destiny2/Actions/Items/TransferItem/',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': XAPIKey,
                'Authorization': "Bearer " + oauth.access
              },
              data: data
            };

            axios(config)
              .then(function (response) {
                resolve(JSON.stringify(response.data));
              })
              .catch(function (error) {
                reject(error);
              });


          })
          .catch(error => {
            console.log("Catch Then");
            console.log(error);
            reject(error);
          });
      });
    });
  }

  //KEEP AT BOTTOM
  server.listen(443);
  console.log("Ready!");
}).catch((error) => {
  console.log(error);
});

