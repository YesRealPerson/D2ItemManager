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
        //console.log(url);
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
  app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));
  const server = https.createServer({ key: key, cert: cert }, app);

  //refresh vault (calls getVault)
  app.get("/refresh", async (req, res) => {
    const x = await getVault(req.query.d2id, req.query.bungieid, req.query.type)
      .catch(err => {
        res.status(500).send(err);
        console.log(err);
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
          var profile = JSON.parse(fs.readFileSync("./public/users/" + name + ".profile.json"));
          await getVault(profile.membershipId, name, profile.membershipType);
          await getCharacters(profile.membershipId, name, profile.membershipType);
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

  //Transfer request
  app.get("/transfer", async (req, res) => {
    var keys = Object.keys(req.query);
    if (!(keys.includes("hash") && keys.includes("stack") && keys.includes("vault") && keys.includes("instance") && keys.includes("character") && keys.includes("bungie"))) {
      //console.log("missing params for transfer items");
      res.status(400).send("Missing parameters");
    } else {
      await transferItem(req.query.hash, req.query.stack, req.query.vault, req.query.instance, req.query.character, req.query.bungie)
        .then(() => {
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

  //Equip request
  app.get("/equip", async (req, res) => {
    var keys = Object.keys(req.query);
    if (!(keys.includes("instance") && keys.includes("character") && keys.includes("bungie"))) {
      //console.log("missing params for transfer items");
      res.status(400).send("Missing parameters");
    } else {
      await equipItem(req.query.instance, req.query.character, req.query.bungie)
        .then(() => {
          res.status(200).send("Item equip successful.");
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

  //Setup tag
  app.get("/tag", async (req, res) => {
    try {
      const q = req.query;
      if (q.bungie == undefined || q.instance == undefined || q.tag == undefined) {
        res.status(400).send("Invalid parameters");
        return;
      }
      fs.readFile('./public/users/' + q.bungie + '.tags.json', (err, data) => {
        if (err) {
          let data = {};
          data[q.instance] = { tags: [q.tag] };
          fs.writeFile('./public/users/' + q.bungie + '.tags.json', JSON.stringify(data), err => {
            if (err) {
              res.status(500).send("Internal error\n" + err);
              return;
            } else {
              res.status(200).send("success");
              return;
            }
          });
        } else {
          data = JSON.parse(data);
          try {
            data[q.instance].tags.push(q.tag);
          } catch {
            data[q.instance] = { tags: [q.tag] };
          }

          fs.writeFile('./public/users/' + q.bungie + '.tags.json', JSON.stringify(data), err => {
            if (err) {
              res.status(500).send("Internal error\n" + err);
              return;
            } else {
              res.status(200).send("success");
              return;
            }
          });
        }
      });
    } catch (err) { console.log(err) }
  })

  app.get("/deltag", async (req, res) => {
    try {
      const q = req.query;
      if (q.bungie == undefined || q.instance == undefined || q.tag == undefined) {
        res.status(400).send("Invalid parameters");
        return;
      }
      fs.readFile('./public/users/' + q.bungie + '.tags.json', (err, data) => {
        if (err) {
          res.status(400).send("You need to add a tag before you can delete one.");
          return;
        } else {
          data = JSON.parse(data);
          console.log(data);
          for (let i = 0; i < data[q.instance].tags.length; i++) {
            if (data[q.instance].tags[i] == q.tag) {
              data[q.instance].tags.splice(i, 1);
            }
          }
          console.log(data);
          fs.writeFile('./public/users/' + q.bungie + '.tags.json', JSON.stringify(data), err => {
            if (err) {
              res.status(500).send("Internal error\n" + err);
              return;
            } else {
              res.status(200).send("success");
              return;
            }
          });
        }
      });
    } catch (err) { res.status(500).send("Internal error\n" + err); }
  })

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
          "membershipType": response.data.Response.profiles[0].membershipType,
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
  const compileVaultData = async (item, location, stats, perks, general, equipped) => {
    return new Promise(async (resolve, reject) => {
      try {
        try {
          var light = general.lightLevel;
        } catch (err) {
          var light = "";
        } try {
          var damageType = general.damageType;
        } catch (err) {
          var damageType = "";
        } try {
          var damageIcon = general.damageIcon;
        } catch (err) {
          var damageIcon = "";
        }
        //get item hash
        var itemHash = item.itemHash;
        //get item info
        var info = await lookup(itemHash, 0)
          .catch(err => {
            reject("compileVaultData 1" + err);
          });
        //get ammo type
        var ammo = info.equippingBlock.ammoType;
        if (ammo == 0) {
          ammo = "none";
        } else if (ammo == 1) {
          ammo = "primary";
        } else if (ammo == 2) {
          ammo = "special";
        } else if (ammo == 3) {
          ammo = "heavy";
        } else if (ammo == 4) {
          ammo = "unknown";
        }
        //get rarity and type
        var rarity = info.itemTypeAndTierDisplayName;
        var family = rarity.substring(rarity.indexOf(" ") + 1);
        var rarity = rarity.split(" ")[0];
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
        //set url of icon watermark
        var watermark = "https://www.bungie.net" + info.iconWatermark;
        //set flavor text of item
        var flavor = info.flavorText;
        //set class type
        var classType = info.classType;
        //
        var breaker = info.breakerType;
        //
        if (info.iconWatermark == undefined) {
          watermark = "https://www.bungie.net/common/destiny2_content/icons/0dac2f181f0245cfc64494eccb7db9f7.png";
        }
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
        if (type == "Emblems") {
          screenshot = "https://www.bungie.net" + info.secondaryIcon;
        }
        //get perks
        //create JSON object for item
        item = {
          "itemhash": itemHash,
          "name": name,
          "flavor": flavor,
          "icon": icon,
          "watermark": watermark,
          "screenshot": screenshot,
          "type": type,
          "ammo": ammo,
          "damagetype": damageType,
          "damageicon": damageIcon,
          "champion": breaker,
          "light": light,
          "location": location,
          "rarity": rarity,
          "family": family,
          "classtype": classType,
          "stats": stats,
          "perks": perks,
          "equipped": equipped
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
                  ));
              var perkType = perkInfo.itemTypeDisplayName;
              perkInfo = perkInfo.displayProperties;
              var name = perkInfo.name;
              if(perkType == "Enhanced Trait"){
                console.log(name);
                if(name.indexOf("Enhanced")==-1){
                  name = "Enhanced "+name;
                }
              }
              perk = {
                "name": name,
                "icon": "https://bungie.net" + perkInfo.icon,
                "description": perkInfo.description
              }
              perkList.push(perk);
            } catch (err) {
              //console.log("getItemsPerks error: " + err);
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
    return new Promise(async (resolve, reject) => {
      try {
        var stats = manifest[id].stats
        var keys = Object.keys(stats);
        var end = [];
        await keys.forEach(async stat => {
          var statInfo = await lookup(stat, 2)
            .catch(err => reject("getItemStats error: " + err));
          var name = statInfo.displayProperties.name;
          var statFull = {
            "name": name,
            "icon": "https://bungie.net" + statInfo.displayProperties.icon,
            "value": stats[stat].value
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
      try {
        var data = manifest[id];

        if (data.damageType != 0) {
          var damageTypes = ["", "Kinetic", "Arc", "Solar", "Void", "", "Stasis", "Strand"];
          var damageLinks = ["./images/empty.png", "./images/kinetic.png", "./images/arc.png", "./images/solar.png", "./images/void.png", "./images/empty.png", "./images/stasis.png", "/images/strand.png"]
          try {
            var damage = damageTypes[data.damageType];
            var link = damageLinks[data.damageType];
          } catch {
            //Item does not have a damage type
            var damage = "";
            var link = "./images/empty.png";
          }
        } else {
          //item is armor
          var damage = "";
          var link = "./images/empty.png";
        }
        try {
          var light = data.primaryStat.value;
        } catch {
          //Does not have a LL
          var light = "";
        }
        var infoObj = {
          damageType: damage,
          damageIcon: link,
          lightLevel: light,
        };
        resolve(infoObj);
      } catch (err) {
        reject("getInstanceInfo error: " + err);
      }
    });
  }

  const getTotalInfo = async (instanceId, item, instancedStats, instancedData, instancedPerks, location, equipped) => {
    return new Promise(async (resolve) => {
      try {
        if (instanceId != undefined && item.bucketHash != 215593132) {
          var itemStats = await getItemStats(instanceId, instancedStats)
            .catch(err => {
              //console.log("No stats for: " + instanceId + " " + err);
            });
          var itemPerks = await getItemPerks(instanceId, instancedPerks)
            .catch(err => {
              //console.log("No stats for: " + instanceId + " " + err);
            });

          var itemGeneral = await getInstanceInfo(instanceId, instancedData)
            .catch(err => {
              //console.log("No light/damage type for: " + instanceId + " " + err);
            });

          var itemInfo = await compileVaultData(item, location, itemStats, itemPerks, itemGeneral, equipped)
            .catch(err => {
              //console.log("Vault compilation error: " + instanceId + " " + err);
            });
          resolve(itemInfo);
        } else if (instanceId != undefined) {
          resolve(
            {
              "itemhash": item.itemHash,
              "name": "Unknown Item",
              "rarity": "Common Unknown",
              "equipped": false,
            }
          );
        } else {
          resolve();
        }
      } catch (err) {
        //console.log(err);
        resolve();
      }

    });
  }

  //gets vault for player
  const getVault = async (d2id, bungieid, membership) => {
    return new Promise(async (resolve, reject) => {
      //console.log("Get Vault for " + bungieid);

      var config = {
        method: 'get',
        url: 'https://www.bungie.net/Platform/Destiny2/' + membership + '/profile/' + d2id + '/?components=102,201,205, 300,304,305',
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
          var totalVault = {};

          //FORMAT DATA

          //loop through vault
          for (i in vault) {
            var item = vault[i];
            var instanceId = item.itemInstanceId;
            if (instanceId != undefined) {
              item = await getTotalInfo(instanceId, item, instancedStats, instancedData, instancedPerks, "Vault", false);
              if (item != null && item != undefined) {
                totalVault[instanceId] = item;
              }
            }
          }

          //character inventories
          for (var k = 0; k < 3; k++) {
            try {
              var currentChar = characters[k];
              //console.log(currentChar);
              vault = characterVaults[currentChar].items;

              for (i in vault) {
                var item = vault[i];
                var instanceId = item.itemInstanceId;
                if (instanceId != undefined) {
                  item = await getTotalInfo(instanceId, item, instancedStats, instancedData, instancedPerks, currentChar, false);
                  if (item != null && item != undefined) {
                    totalVault[instanceId] = item;
                  }
                }
              }
            } catch (err) {
              console.log("Error! \n getVault characterInventories ForLoop\n" + err);
              break;
            }
          }

          //get currently equipped items
          let equipped = data.characterEquipment.data;
          let characterIds = Object.keys(equipped);
          let test = "";
          for (let j = 0; j < characterIds.length; j++) {
            let c = characterIds[j];
            let items = equipped[c].items;
            for (let i = 0; i < items.length; i++) {
              let item = items[i];
              let instanceId = item.itemInstanceId;
              item = await getTotalInfo(instanceId, item, instancedStats, instancedData, instancedPerks, c, true);
              if (item != null && item != undefined) {
                totalVault[instanceId] = item;
              }
            }
          }

          vault = { "data": totalVault };
          fs.writeFile("./public/users/" + bungieid + ".vault.json", JSON.stringify(vault), err => {
            if (err) reject("Error: " + err);
            else resolve(vault);
          });
        })
        .catch((error) => {
          reject("Error: " + error);
        });
    })

  }

  //gets associated characters for a player
  const getCharacters = (d2id, bungieid, membership) => {
    return new Promise(async (resolve, reject) => {
      //console.log("Get Characters for " + bungieid);
      var config = {
        method: 'get',
        url: 'https://bungie.net/platform/Destiny2/' + membership + '/Profile/' + d2id + '/?components=200',
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
              reject("GetCharacters Error " + err)
            } else {
              resolve("Success");
            }
          });
        })
        .catch((error) => {
          reject("GetCharacters Error " + error);
        });
    });
  }

  //Checks and refreshes oauth token
  const refreshToken = (oauth) => {
    return new Promise((resolve, reject) => {
      var d = new Date().getTime() + 1000;
      d = d / 1000;
      if (oauth.accessExpire < d) {
        if (oauth.refreshExpire < d) {
          //refresh token expired
          reject("350.Error: Re-Login Required");
        } else {
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
                  reject("250.Error: could not write to OAuth file\n" + err);
                } else {
                  resolve("200.Success: New OAuth token generated");
                }
              });
            })
            .catch(error => {
              console.log(error);
              reject("150.Error: " + error);
            });
        }
      } else {
        resolve("100.Success: OAuth file Up-To-Date");
      }
    });
  }

  //Transfers an item
  const transferItem = async (itemReferenceHash, stackSize, vault, instance, character, bungie) => {
    return new Promise(async (resolve, reject) => {
      try {
        let profile = {};

        fs.readFile("./public/users/" + bungie + ".profile.json", async (err, data) => {
          if (err) {
            reject(err);
          }
          profile = JSON.parse(data);
          fs.readFile("./public/users/" + bungie + ".oauth.json", async (err, data) => {
            if (err) {
              reject(err);
            }
            var oauth = JSON.parse(data);

            await refreshToken(oauth)
              .then((response) => {
                let code = response.split('.')[0];
                console.log(code);
                if (code == "200") {
                  fs.readFile("./public/users/" + bungie + ".oauth.json", async (err, data) => {
                    if (err) {
                      reject(err);
                    }
                    oauth = JSON.parse(data);
                  });
                }else if(code != "100"){
                  console.log(response);
                  reject("500")
                }
              }).then(() => {
                //transfer item

                var data = JSON.stringify({
                  "itemReferenceHash": itemReferenceHash,
                  "stackSize": stackSize,
                  "transferToVault": vault,
                  "itemId": instance,
                  "characterId": character,
                  "membershipType": profile.membershipType
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
          });
        });
      }
      catch (err) {
        reject(err);
      }
    });
  }

  //Equips item
  const equipItem = async (instance, character, bungie) => {
    return new Promise(async (resolve, reject) => {
      try {
        let profile = {};

        fs.readFile("./public/users/" + bungie + ".profile.json", async (err, data) => {
          if (err) {
            //console.log("reject sadge");
            reject(err);
          }
          profile = JSON.parse(data);
          fs.readFile("./public/users/" + bungie + ".oauth.json", async (err, data) => {
            if (err) {
              //console.log("reject sadge");
              reject(err);
            }
            var oauth = JSON.parse(data);

            await refreshToken(oauth)
              .then(async (response) => {
                let code = response.split('.')[0];
                if (code == "200") {
                  await fs.readFile("./public/users/" + bungie + ".oauth.json", async (err, data) => {
                    if (err) {
                      reject(err);
                    }
                    oauth = await JSON.parse(data);
                  });
                }else if(code != "100"){
                  console.log(response);
                  reject("500")
                }
              }).then(() => {
                //console.log("Transfering Item for: " + bungie);
                //transfer item

                var data = JSON.stringify({
                  "itemId": instance,
                  "characterId": character,
                  "membershipType": profile.membershipType
                });

                var config = {
                  method: 'post',
                  url: 'https://www.bungie.net/Platform/Destiny2/Actions/Items/EquipItem/',
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


              });
          });
        });
      }
      catch (err) {
        reject(err);
      }
    });
  }

  //KEEP AT BOTTOM
  server.listen(443);
  console.log("Ready!");
  fs.readdir(path.join(__dirname, "public/users"), (err, files) => {
    if (err) {
      console.log(err);
    } else {
      try {
        let BreakException = {};
        files.forEach(file => {
          if (file != "placeholder.txt") {
            import("open").then((open) => {
              let url = "https://localhost/app?user=" + file.split(".")[0];
              open.default(url);
            })
            throw BreakException
          }
        })
        import("open").then((open) => {
          let url = "https://localhost/";
          open.default(url);
        })
      } catch { }
    }
  })
}).catch((error) => {
  console.log(error);
});