// Import libraries
const express = require('express');
const axios = require('axios');
const https = require('https');
const fs = require('fs');
const qs = require('qs');
const path = require('path');

const key = fs.readFileSync('./key.pem');
const cert = fs.readFileSync('./cert.pem');

require('dotenv').config()
const bAuth = process.env.BASIC;
const XAPIKey = process.env.XAPI;

//get manifest
const getJSON = (url) => {
  return new Promise((resolve, reject) => {
    var config = {
      method: "get",
      url: url
    }

    axios(config)
      .then(response => {
        console.log(url);
        resolve(response.data);
      })
      .catch((err) => reject(err));
  });
}

//retrieve item and bucket manifest
const manifestPromise = async () => {
  return new Promise((resolve, reject) => {
    var config = {
      method: 'get',
      url: 'https://www.bungie.net/platform/destiny2/manifest',
      headers: {
        'X-API-Key': XAPIKey
      }
    };

    axios(config)
      .then(async (response) => {
        var data = response.data.Response.jsonWorldComponentContentPaths.en;
        var toDownload = ['https://www.bungie.net' + data.DestinyInventoryItemDefinition, 'https://www.bungie.net' + data.DestinyInventoryBucketDefinition, 'https://www.bungie.net' + data.DestinyStatDefinition, 'https://www.bungie.net' + data.DestinySandboxPerkDefinition];
        var manifests = [];
        manifests.push(
          await getJSON(toDownload[0])
        );
        console.log("Inventory downloaded");
        manifests.push(
          await getJSON(toDownload[1])
        );
        console.log("Bucket downloaded");
        manifests.push(
          await getJSON(toDownload[2])
        );
        console.log("Stat downloaded");
        manifests.push(
          await getJSON(toDownload[3])
        );
        console.log("Perk downloaded");
        resolve(manifests);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

//manifest download successful
manifestPromise().then(async (res) => {
  //get manifest files
  var itemManifest = res[0];
  var bucketManifest = res[1];
  var statManifest = res[2];
  var perkManifest = res[3];

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
    const x = await getVault(req.query.d2id, req.query.bungieid)
      .catch(err => {
        res.status(500).send(err);
        throw new Error(err);
      });
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
    axios(config).then((response) => {
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
        .then(async () => {
          var destinyID = JSON.parse(fs.readFileSync("./public/users/" + name + ".profile.json")).membershipId;
          await getVault(destinyID, name);
          await getCharacters(destinyID, name);
        })
        .then(() => {
          res.redirect('/app?user=' + name);
        })
    })
      .catch((error) => {
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
          try {
            message = error.response.data.Message;
          } catch {
            message = "You may need to relogin";
          }
          res.status(400).send(message);
        });
    }
  });

  //gets Destiny ID and username
  const getName = (bungie) => {
    return new Promise((resolve, reject) => {
      var config = {
        method: 'get',
        url: 'https://bungie.net/platform/Destiny2/254/Profile/' + bungie + '/LinkedProfiles',
        headers: {
          'X-API-Key': XAPIKey
        }
      };

      axios(config).then((response) => {
        var data = JSON.stringify({
          "membershipId": response.data.Response.profiles[0].membershipId,
          "name": response.data.Response.profiles[0].displayName
        });
        fs.writeFileSync("./public/users/" + bungie + '.profile.json', data);
        resolve(data);
      })
        .catch((error) => {
          reject(error);
        });
    })
  }

  //gets general information from item hash
  //type: 0 item definition
  //type: 1 bucket definition
  //type: 2 stat definition
  //type: 3 perk definition
  const lookup = (id, type) => {
    return new Promise((resolve, reject) => {
      if (type == 0) {
        var item = itemManifest[id];
        if (item != undefined) {
          resolve(item);
        } else {
          reject("Invalid id parameter");
        }
      }
      else if (type == 1) {
        var bucket = bucketManifest[id];
        if (bucket != undefined) {
          resolve(bucket);
        } else {
          reject("Invalid id parameter");
        }
      }
      else if (type == 2) {
        var stat = statManifest[id];
        if (stat != undefined) {
          resolve(stat);
        } else {
          reject("Invalid id parameter");
        }
      }
      else if (type == 3) {
        var stat = perkManifest[id];
        if (stat != undefined) {
          resolve(stat);
        } else {
          reject("Invalid id parameter");
        }
      } else {
        reject("Invalid type parameter");
      }
    });

  }

  //rewrites item data into the way I want it :)
  const compileVaultData = async (item, location, stats, perks, general) => {
    return new Promise(async (resolve, reject) => {
      try {
        try{
          var light = general.lightLevel;
        }catch(err){
          var light = "N/A";
        }try{
          var damageType = general.damageType;
        }catch(err){
          var damageType = "N/A";
        }
        //get item instance id
        var itemInstanceId = item.itemInstanceId;
        //get item hash
        var itemHash = item.itemHash;
        //get item info
        var info = await lookup(itemHash, 0)
          .catch(err => {
            reject("compileVaultData 1" + err);
          });
        //get rarity and type
        var rarity = info.itemTypeAndTierDisplayName;
        //get item type
        var type = info.inventory.bucketTypeHash;
        //change item type from hash to string
        type = await lookup(type, 1)
          .catch(err => {
            reject("compileVaultData 2" + err);
          });
        type = type.displayProperties.name.split(" ")[0];
        //get name of item
        var name = info.displayProperties.name;
        //get applied ornament
        var override = item.overrideStyleItemHash;
        //if ornament exists
        if (override != undefined) {
          //set obj to ornament
          info = await lookup(override, 0)
            .catch(err => {
              reject("compileVaultData 3" + err);
            });
        }
        //set url of icon of item
        var icon = "https://www.bungie.net" + info.displayProperties.icon;
        //set url of screenshot of item
        var screenshot = "https://www.bungie.net" + info.screenshot;
        //get perks
        //create JSON object for item
        item = {
          [itemInstanceId]: {
            "itemHash": itemHash,
            "name": name,
            "icon": icon,
            "screenshot": screenshot,
            "type": type,
            "damageType": damageType,
            "light": light,
            "location": location,
            "rarity": rarity,
            "stats": stats,
            "perks": perks
          }
        }
        resolve(item);
      } catch (error) {
        reject("compileVaultData " + error);
      }
    });
  }

  //gets perks for item
  const getItemPerks = async (id, manifest) => {
    return new Promise((resolve, reject) => {
      try {
        var perks = manifest[id].sockets;
        var perkList = [];
        perks.forEach(async perk => {
          if (perk.isEnabled && perk.isVisible) {
            try {
              var perkInfo = (
                await lookup(perk.plugHash, 0)
                  .catch(err => reject("getItemsPerks error for +" + perk.plugHash + ": " + err)
                  )).displayProperties;
              perk = {
                "name": perkInfo.name,
                "icon": "https://bungie.net" + perkInfo.icon,
                "description": perkInfo.description
              }
              perkList.push(perk);
            } catch (err) {
              console.log("getItemsPerks error: " + err);
            }
          }
        });
        resolve(perkList);
      } catch (err) {
        reject("getItemsPerks error: " + err);
      }
    });
  }

  //gets stats for item
  const getItemStats = async (id, manifest) => {
    return new Promise((resolve, reject) => {
      try {
        var stats = manifest[id].stats
        var keys = Object.keys(stats);
        var end = [];
        keys.forEach(async stat => {
          var statInfo = await lookup(stat, 2)
            .catch(err => reject("getItemStats error: " + err));
          var statFull = {
            [statInfo.displayProperties.name]: {
              "icon": statInfo.displayProperties.icon,
              "value": stats[stat].value
            }
          }
          end.push(statFull);
        });
        resolve(end);
      } catch (err) {
        reject("getItemStats error: " + err);
      }
    });
  }

  //gets general instanced item info
  const getInstanceInfo = async (id, manifest) => {
    return new Promise((resolve, reject) => {
      var damageTypes = ["", "Kinetic", "Arc", "Solar", "Void", "", "Stasis"];
      try {
        var data = manifest[id];

        try{
          var damage = damageTypes[data.damageType];
          if(damage == ""){
            damage = "N/A";
          }
        }catch{
          console.log("No damage type for "+id);
          var damage = "N/A";
        }
        try{
          var light = data.primaryStat.value;
          if(light == ""){
            light = "N/A";
          }
        }catch{
          console.log("No light level for "+id);
          var light = "N/A";
        }

        var infoObj = {
          damageType: damage,
          lightLevel: light
        };
        resolve(infoObj);
      } catch (err) {
        reject("getInstanceInfo error: " + err);
      }
    });
  }

  //gets vault for player
  const getVault = async (d2id, bungieid) => {
    return new Promise(async (resolve, reject) => {
      console.log("Get Vault for " + bungieid);

      var config = {
        method: 'get',
        url: 'https://www.bungie.net/Platform/Destiny2/3/profile/' + d2id + '/?components=102,201,300,304,305',
        headers: {
          'X-API-Key': XAPIKey
        }
      }

      axios(config)
        .then(async (response) => {
          //main response object
          var data = response.data.Response;
          //get vault data
          var vault = data.profileInventory.data.items;
          //get character inventories
          var characterVaults = data.characterInventories.data;
          //characters
          var characters = Object.keys(characterVaults);

          //get instanced item stats
          var instancedStats = data.itemComponents.stats.data;
          //get instanced item perks
          var instancedPerks = data.itemComponents.sockets.data;
          //get instanced item general info
          var instancedData = data.itemComponents.instances.data;

          //variable to push all data into
          var totalVault = [];

          //FORMAT DATA

          //loop through vault
          for (i in vault) {
            var item = vault[i];
            var instanceId = item.itemInstanceId;
            if (instanceId != undefined && item.lockable && item.bucketHash != 215593132) {
              var itemStats = await getItemStats(instanceId, instancedStats)
                .catch(err => {
                  console.log("No stats for: " + instanceId + " " + err);
                });
              var itemPerks = await getItemPerks(instanceId, instancedPerks)
                .catch(err => {
                  console.log("No stats for: " + instanceId + " " + err);
                });

              var itemGeneral = await getInstanceInfo(instanceId, instancedData)
                .catch(err => {
                  console.log("No light/damage type for: " + instanceId + " " + err);
                });

              var itemInfo = await compileVaultData(item, "Vault", itemStats, itemPerks, itemGeneral)
                .catch(err => {
                  console.log("Vault compilation error: " + instanceId + " " + err);
                });

              totalVault.push(itemInfo);
            }
          }

          var currentChar = characters[0];
          vault = characterVaults[currentChar].items;

          for (i in vault) {
            var item = vault[i];
            var instanceId = item.itemInstanceId;
            if (instanceId != undefined && item.lockable && item.bucketHash != 215593132) {
              itemStats = [];
              itemPerks = [];
              itemGeneral = {};

              itemStats = await getItemStats(instanceId, instancedStats)
                .catch(err => {
                  console.log("No stats for: " + instanceId + " " + err);
                });
              itemPerks = await getItemPerks(instanceId, instancedPerks)
                .catch(err => {
                  console.log("No perks for: " + instanceId + " " + err);
                });
              
              itemGeneral = await getInstanceInfo(instanceId, instancedData)
                .catch(err => {
                  console.log("No light/damage type for: " + instanceId + " " + err);
                });

              var itemInfo = await compileVaultData(item, currentChar, itemStats, itemPerks, itemGeneral)
                .catch(err => {
                  console.log("Vault compilation error: " + instanceId + " " + err);
                });

              totalVault.push(itemInfo);
            }
          }

          try {
            currentChar = characters[1];
            vault = characterVaults[currentChar].items;

            for (i in vault) {
              var item = vault[i];
              var instanceId = item.itemInstanceId;
              if (instanceId != undefined && item.lockable && item.bucketHash != 215593132) {
                itemStats = [];
                itemPerks = [];

                itemStats = await getItemStats(instanceId, instancedStats)
                  .catch(err => {
                    console.log("No stats for: " + instanceId + " " + err);
                  });
                itemPerks = await getItemPerks(instanceId, instancedPerks)
                  .catch(err => {
                    console.log("No perks for: " + instanceId + " " + err);
                  });
                  
                itemGeneral = await getInstanceInfo(instanceId, instancedData)
                  .catch(err => {
                    console.log("No light/damage type for: " + instanceId + " " + err);
                  });

                var itemInfo = await compileVaultData(item, currentChar, itemStats, itemPerks, itemGeneral)
                  .catch(err => {
                    console.log("Vault compilation error: " + instanceId + " " + err);
                  });

                totalVault.push(itemInfo);
              }
            }
          } catch {
            console.log("Second character DNE");
          }

          try {
            currentChar = characters[2];
            vault = characterVaults[currentChar].items;

            for (i in vault) {
              var item = vault[i];
              var instanceId = item.itemInstanceId;
              if (instanceId != undefined && item.lockable && item.bucketHash != 215593132) {
                itemStats = [];
                itemPerks = [];

                itemStats = await getItemStats(instanceId, instancedStats)
                  .catch(err => {
                    console.log("No stats for: " + instanceId + " " + err);
                  });
                itemPerks = await getItemPerks(instanceId, instancedPerks)
                  .catch(err => {
                    console.log("No perks for: " + instanceId + " " + err);
                  });

                itemGeneral = await getInstanceInfo(instanceId, instancedData)
                  .catch(err => {
                    console.log("No light/damage type for: " + instanceId + " " + err);
                  });

                var itemInfo = await compileVaultData(item, currentChar, itemStats, itemPerks, itemGeneral)
                  .catch(err => {
                    console.log("Vault compilation error: " + instanceId + " " + err);
                  });

                totalVault.push(itemInfo);
              }
            }
          } catch {
            console.log("Third character DNE");
          }

          vault = { "data": totalVault };
          fs.writeFile("./public/users/" + bungieid + ".vault.json", JSON.stringify(vault), err => {
            if (err) reject("Error: " + err);
            else resolve(vault);
          });

          //TODO: get equipped items component 205
          //Maybe not idk
        })
        .catch((error) => {
          console.log(error);
          reject("Error: " + error);
        });
    })

  }

  //gets associated characters for a player
  const getCharacters = (d2id, bungieid) => {
    return new Promise(async (resolve, reject) => {
      console.log("Get Characters for " + bungieid);
      var config = {
        method: 'get',
        url: 'https://bungie.net/platform/Destiny2/3/Profile/' + d2id + '/?components=200',
        headers: {
          'X-API-Key': XAPIKey
        }
      };

      axios(config)
        .then((response) => {
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
          fs.writeFile("./public/users/" + bungieid + '.profile.json', JSON.stringify(endJSON), err => {
            if (err) {
              reject("GetCharacters Error "+error)
            } else {
              resolve("Success");
            }
          });
        })
        .catch((error) => {
          reject("GetCharacters Error "+error);
        });
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
            if (response != 200) {
              fs.readFile("./public/users/" + bungie + ".oauth.json", async (err, data) => {
                if (err) {
                  console.log("reject pog");
                  reject(err);
                }
                oauth = JSON.parse(data);
              });
            }
            console.log("Transfering Item for: " + bungie);
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
              .then((response) => {
                resolve(JSON.stringify(response.data));
              })
              .catch((error) => {
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