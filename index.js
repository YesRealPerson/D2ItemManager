const express = require("express");
const axios = require("axios");
const https = require("https");
const fs = require("fs");
const qs = require('qs');
const path = require('path');

const key = fs.readFileSync('./key.pem');
const cert = fs.readFileSync('./cert.pem');

require('dotenv').config()
const bAuth = process.env.BASIC;
const XAPIKey = process.env.XAPI;

//retrieve itemManifest
let manifestPromise = function getManifest(){
  return new Promise((resolve ,reject)=>{
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
            if(!fs.existsSync('./'+filename)){
                var c = {
                    method: 'get',
                    url: 'https://www.bungie.net'+url,
                };
                axios(c)
                    .then(function (response){
                        var manifest = JSON.stringify(response.data);
                        //write manifest
                        fs.writeFileSync(filename, manifest);
                        //
                        resolve(filename);
                    })
            }
            else{
              resolve(filename);
            }
          })
          .catch(function (error) {
              reject("Failed to get manifest");
          });
  });
}

manifestPromise().then((res) => {
  var itemManifest = JSON.parse(fs.readFileSync('./'+res));
  const app = express();
const server = https.createServer({ key: key, cert: cert }, app);

//transfer, POST
app.get("/moveitem", (req, res) => {
  const data = [req.query.hash, req.query.stack, req.query.vault, req.query.instance, req.query.currentChar, req.query.membership, req.query.id];
  data.forEach((item) => {
    if (typeof item == typeof undefined) {
      res.status(400).send("invalid input");
    }
  });
  var what = ({
    'itemReferenceHash': data[0],
    'stackSize': data[1],
    'transferToVault': data[2],
    'itemId': data[3],
    'characterId': data[4],
    'membershipType': data[5],
  });
  var token = JSON.parse(fs.readFileSync(req.query.id + ".oauth.json"));
  if (token.timeof + token.expires_in < new Date() / 1000) {
    console.log("Expired token");
    //call refresh token pass refresh token in
    //token = refresh;
    //or something
    //if refresh fails prompt user to re-login
  }
  /*
  hash = 0
  stack = 1
  vault = 2
  instance = 3
  char = 4;
  membership = 5;
  */
  var config = {
    method: 'post',
    url: 'https://www.bungie.net/Platform/Destiny2/Actions/Items/TransferItem/',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': "Bearer " + token.access_token,
      'X-API-Key': XAPIKey
    },
    data: what
  };
  axios(config).then(function (response) {
    res.status(200).send();
  }).catch(function(error){
    res.status(500).send();
    console.log(error);
  })
});

//login page
app.get("/redirect", (req, res) => {
  res.sendFile(path.join(__dirname, '/login.html'));
});

//if no user specified redirect to login page
//if user specifed go to app page
app.get("/", (req, res) => {
  var id = req.query.user;
  var type = req.query.type;
  if (type === "0") {
    res.redirect('/app/?user=' + id);
  } else if (type === "1") {
    fs.readFile(__dirname + "/" + req.query.user, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('404: File not found');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      }
    });
  } else {
    res.redirect("/redirect");
  }
});

//app page
app.get("/app", (req, res) => {
  res.sendFile(path.join(__dirname, '/app.html'));
});

//oauth redirect page
app.get("/oauth/redirect", (req, res) => {
  //get code from query
  var data = qs.stringify({
    'grant_type': 'authorization_code',
    'code': req.query.code
  });
  var config = {
    method: 'post',
    url: 'https://www.bungie.net/Platform/App/OAuth/Token/',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + bAuth,
    },
    data: data
  };
  axios(config).then(function (response) {
    response.data["timeof"] = new Date() / 1000;
    var data = JSON.stringify(response.data);
    var name = JSON.parse(data).membership_id;
    fs.writeFileSync(name + '.oauth.json', data);
    getName(name)
      .then(function () {
        var id = JSON.parse(fs.readFileSync('./' + name + '.profile.json'));
        getVault(id.membershipId)
          .then(function () {
            getCharacters(name).then(function () {
              res.redirect("/?user=" + name + "&type=0");
            })
              .catch(function (err) {
                console.log("120 " + err);
              })
          })
          .catch(function (err) {
            console.log("75");
            console.log(err);
          });
      })
      .catch(function (err) {
        console.log("80");
        console.log(err);
      });
  })
    .catch(function (error) {
      console.log("85");
      console.log(error);
    });
});

//call vault refresh
app.get("/refresh", (req, res) => {
  getVault(req.query.id).then(function () {
    res.status(200).send("refreshed");
  })
});

function getName(id) {
  return new Promise(function (resolve, reject) {
    var config = {
      method: 'get',
      url: 'https://bungie.net/platform/Destiny2/254/Profile/' + id + '/LinkedProfiles',
      headers: {
        'X-API-Key': XAPIKey
      }
    };

    axios(config)
      .then(function (response) {
        var data = JSON.stringify(response.data);
        var obj = JSON.parse(data);
        fs.writeFileSync(id + '.profile.json', JSON.stringify({ "membershipId": obj.Response.profiles[0].membershipId, "name": obj.Response.profiles[0].displayName }));
        resolve(this.responseText);
      })
      .catch(function (error) {
        reject(error);
      });
  });
}

function getCharacters(id) {
  return new Promise(function (resolve, reject) {
    var d2id = JSON.parse(fs.readFileSync(id + '.profile.json'));
    var config = {
      method: 'get',
      url: 'https://bungie.net/platform/Destiny2/3/Profile/' + d2id.membershipId + '/?components=200',
      headers: {
        'X-API-Key': XAPIKey
      }
    };

    axios(config)
      .then(function (response) {
        var data = JSON.stringify(response.data);
        var obj = JSON.parse(data);
        var endJSON = JSON.parse(fs.readFileSync(id + '.profile.json'));
        var chars = Object.keys(obj.Response.characters.data);
        var charsArray = [];
        chars.forEach((char, index) => {
          charsArray.push({
            "classType": obj.Response.characters.data[char].classType,
            "charId": obj.Response.characters.data[char].characterId,
          });
        });
        endJSON.classes = charsArray;
        fs.writeFileSync(id + '.profile.json', JSON.stringify(endJSON));
        resolve(this.responseText);
      })
      .catch(function (error) {
        reject(error);
      });
  });
}

function getIcon(id) {
  return JSON.stringify(itemManifest[id]);
}

//make JSON with iventory information (equipped, vault, inventory)
function getVault(id) {
  return new Promise(function (resolve, reject) {
    var config = {
      method: 'get',
      url: 'https://www.bungie.net/Platform/Destiny2/3/profile/' + id + '/?components=102',
      headers: {
        'X-API-Key': XAPIKey
      }
    };

    axios(config)
      .then(function (response) {
        var data = JSON.parse(JSON.stringify(response.data)).Response.profileInventory.data;
        var equipables = [];
        for (var i = 0; i < data.items.length; i++) {
          var bucketHash = data.items[i].bucketHash;
          if (bucketHash === 138197802) {
            var itemInstanceId = data.items[i].itemInstanceId;
            var itemHash = data.items[i].itemHash;
            var obj = JSON.parse(getIcon(itemHash));
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
            var name = obj.displayProperties.name;
            var icon = "https://www.bungie.net" + obj.displayProperties.icon;
            var screenshot = "https://www.bungie.net" + obj.screenshot;
            var push = { "itemInstanceId": itemInstanceId, "itemHash": itemHash, "name": name, "icon": icon, "screenshot": screenshot, "type": type, "location": "vault" };
            equipables.push(push);
          }
        }
        //get player inventory
        var config = {
          method: 'get',
          url: 'https://www.bungie.net/Platform/Destiny2/3/profile/' + id + '/?components=201',
          headers: {
            'X-API-Key': XAPIKey
          }
        };

        axios(config)
          .then(function (response) {
            var charInvens = JSON.parse(JSON.stringify(response.data)).Response.characterInventories.data;
            for (var key in charInvens) {
              data = charInvens[key];
              for (var i = 0; i < data.items.length; i++) {
                var bucketHash = data.items[i].bucketHash;
                var bucketTypes = [1498876634, 2465295065, 953998645, 3448274439, 3551918588, 14239492, 20886954, 1585787867]
                if (bucketTypes.includes(bucketHash)) {
                  var itemInstanceId = data.items[i].itemInstanceId;
                  var itemHash = data.items[i].itemHash;
                  var location = data.items[i].location;
                  var obj = JSON.parse(getIcon(itemHash));
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
                  var name = obj.displayProperties.name;
                  var icon = "https://www.bungie.net" + obj.displayProperties.icon;
                  var screenshot = "https://www.bungie.net" + obj.screenshot;
                  var push = { "itemInstanceId": itemInstanceId, "itemHash": itemHash, "name": name, "icon": icon, "screenshot": screenshot, "type": type, "location": location};
                  equipables.push(push);
                 }
              }
            }
            fs.writeFile(id + '.vault.json', JSON.stringify({ "data": equipables }), err => {
              if (err) {
                reject(err);
              }
            });
          });
        // var config = {
        //   method: 'get',
        //   url: 'https://www.bungie.net/Platform/Destiny2/3/profile/' + id + '/?components=205',
        //   headers: {
        //     'X-API-Key': XAPIKey
        //   }
        // };

        // axios(config)
        //   .then(function (response) {
        //     var data = JSON.parse(JSON.stringify(response.data)).Response.characterEquipment.data;
        //     var equipables = [];
        //     for(var i = 0; i < data.items.length; i++){
        //       var bucketHash = data.items[i].bucketHash;
        //       if(bucketHash === 138197802){
        //         var itemInstanceId = data.items[i].itemInstanceId;
        //         var itemHash = data.items[i].itemHash;
        //         var obj = JSON.parse(getIcon(itemHash));
        //         var type = obj.inventory.bucketTypeHash;
        //         switch(type){
        //           case 1498876634:
        //             type ="Kinetic";
        //             break;
        //           case 2465295065:
        //             type ="Energy";
        //             break;
        //           case 953998645:
        //             type ="Power";
        //             break;
        //           case 3448274439:
        //             type ="Helmet";
        //             break;
        //           case 3551918588:
        //             type ="Gauntlets";
        //             break;
        //           case 14239492:
        //             type ="Chest";
        //             break;
        //           case 20886954:
        //             type ="Legs";
        //             break;
        //           case 1585787867:
        //             type ="Class";
        //         }
        //         var name = obj.displayProperties.name;
        //         var icon = "https://www.bungie.net"+obj.displayProperties.icon;
        //         var screenshot = "https://www.bungie.net"+obj.screenshot;
        //         var push = {"itemInstanceId":itemInstanceId,"itemHash":itemHash,"name":name,"icon":icon, "screenshot":screenshot, "type":type, "vault":true};
        //         equipables.push(push);
        //       }
        //     }
        //   });
      }).then(function () {
        resolve(this.responseText);
      })
      .catch(function (error) {
        reject(error);
      });
  })
}

server.listen(443);
}).catch((error) => {
  console.log(error);
});