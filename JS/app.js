let access=localStorage.getItem("access"),refresh=localStorage.getItem("refresh"),refreshed=Date.now();const accID=localStorage.getItem("accountID"),baseURL="https://www.bungie.net/platform/Destiny2/",dexie=new Dexie("test");dexie.version(1).stores({manifests:"DBNAME"});const buckets={1498876634:"kinetic",2465295065:"energy",953998645:"power",3448274439:"helmet",3551918588:"gauntlets",14239492:"chest",20886954:"leg",1585787867:"class",3284755031:"subclass",284967655:"ships",4023194814:"ghosts",2025709351:"vehicle"};let manifests=[];const XAPI="12d813dd5ce94d8b9eab4f729e03575a",globalReq={credentials:"include",headers:{"X-API-Key":XAPI,"Content-Type":"application/json",Authorization:"Bearer "+access}};let membershipType=-1,membershipID=-1,displayName="",db={characters:{},vault:{}};transferData=[];let breakers=["","https://www.bungie.net/common/destiny2_content/icons/DestinyBreakerTypeDefinition_07b9ba0194e85e46b258b04783e93d5d.png","https://www.bungie.net/common/destiny2_content/icons/DestinyBreakerTypeDefinition_da558352b624d799cf50de14d7cb9565.png","https://www.bungie.net/common/destiny2_content/icons/DestinyBreakerTypeDefinition_825a438c85404efd6472ff9e97fc7251.png"],breakerNames=["","Anti-Barrier","Overload Rounds","Unstoppable Rounds"],classTypes=["Titan","Hunter","Warlock"],rarity=["What the fuck is this?","Currency","Common","Uncommon","Rare","Legendary","Exotic"],times=[];const indb=(e,t)=>new Promise((s,n)=>{let i=indexedDB.open(e,t);i.onsuccess=e=>{s(e.target.result)},i.onerror=e=>{console.log(`indexedDB error: ${e.target.errorCode}`)},i.onupgradeneeded=e=>{console.log("Upgrade function called but I don't think I really care?")}}),refreshManifests=async()=>new Promise(async(e,t)=>{try{let s=await (await fetch(baseURL+"manifest",{credentials:"include",headers:{"X-API-Key":XAPI}})).json();s=s.Response.jsonWorldComponentContentPaths.en;let n=["https://www.bungie.net"+s.DestinyInventoryItemDefinition,"https://www.bungie.net"+s.DestinyInventoryBucketDefinition,"https://www.bungie.net"+s.DestinyStatDefinition,"https://www.bungie.net"+s.DestinySandboxPerkDefinition,"https://www.bungie.net"+s.DestinyItemCategoryDefinition],i=JSON.parse(localStorage.getItem("previousManifests")),a=[!1,!1,!1,!1,!1];if(null!=i)for(let r=0;r<4;r++)a[r]=i[r]!=n[r];else a=[!0,!0,!0,!0];let l=["Inventory Item Def","Inventory Bucket Def","Stat Def","Perk Def","Item Category Def"],o=["inventoryItemDef","bucketDef","statDef","perkDef","itemCategoryDef"];for(let c=0;c<5;c++){let p=o[c],d=await dexie.manifests.get(p);if(!a[c]&&d)console.log("Manifest exists in local DB"),manifests[c]=d;else{console.log("Downloading: "+l[c]);let m=await (await fetch(n[c])).json();m.DBNAME=p,console.log("Downloaded "+l[c]),await dexie.manifests.put(m),manifests[c]=m}}localStorage.setItem("previousManifests",JSON.stringify(n)),e(200)}catch(y){t(y)}}),refreshAccess=async()=>new Promise(async(e,t)=>{try{let s=await fetch("https://d2refresh.spark952.workers.dev/?code="+encodeURIComponent(refresh));access=(s=await s.json()).access_token,refresh=s.refresh_token,globalReq.headers.Authorization="Bearer "+access,localStorage.setItem("access",access),localStorage.setItem("refresh",refresh),e(200)}catch(n){t(n)}}),getItem=(e,t,s)=>{let n=s.Response.itemComponents,i=n.instances.data[e],a=n.stats.data[e],r=n.sockets.data[e],l=n.reusablePlugs.data[e],o=manifests[0][t];void 0==i.primaryStat&&(i.primaryStat={value:-1});let c={hash:t,id:e,name:o.displayProperties.name,flavor:o.flavorText,icon:o.displayProperties.icon,background:o.screenshot,watermark:o.iconWatermark,rarity:o.inventory.tierType,type:o.itemCategoryHashes,breakerType:o.breakerType,light:i.primaryStat.value,element:i.damageType,perks:[],stats:[],bucket:o.inventory.bucketTypeHash};if(void 0!=a){let p=Object.keys(a=a.stats);for(let d=0;d<p.length;d++){let m=p[d],y=manifests[2][m];c.stats.push({name:y.displayProperties.name,icon:y.displayProperties.icon,value:a[m].value})}}c.stats.sort((e,t)=>(""+e.name).localeCompare(""+t.name));let h={},u=1!=c.type[1];if(void 0!=r){r=r.sockets;for(let f=0;f<r.length;f++){let g=r[f];if(g.isVisible&&!h[g.plugHash]){let b=manifests[0][g.plugHash],$="Uncommon Enhanced Trait"==b.itemTypeAndTierDisplayName;c.perks.push([{name:b.displayProperties.name,icon:b.displayProperties.icon,description:b.displayProperties.description,enhanced:$}]),u||(h[g.plugHash]=1)}}}if(void 0!=l){let v=Object.keys(l=l.plugs);for(let w=0;w<v.length;w++){let _=v[w],k=l[_];for(let I=0;I<k.length;I++)if(k[I].canInsert&&k[I].enabled&&0!=c.perks[_]&&!h[k[I].plugItemHash]){let T=manifests[0][k[I].plugItemHash],D="Uncommon Enhanced Trait"==T.itemTypeAndTierDisplayName;-1!=T.itemTypeDisplayName.indexOf("Trait")&&(c.perks[_].push({name:T.displayProperties.name,icon:T.displayProperties.icon,description:T.displayProperties.description,enhanced:D}),h[k[I].plugItemHash]=1)}}}return c},itemToHTML=(e,t)=>{let s="https://bungie.net",n={3:"Common",4:"Rare",5:"Legendary",6:"Exotic"},i={1:"https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_3385a924fd3ccb92c343ade19f19a370.png",2:"https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_092d066688b879c807c3b460afdd61e6.png",3:"https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_2a1773e10968f2d088b97c22b22bba9e.png",4:"https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_ceb2f6197dccf3958bb31cc783eb97a0.png",5:"https://www.bungie.net/img/misc/missing_icon_d2.png",6:"https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_530c4c3e7981dc2aefd24fd3293482bf.png",7:"https://www.bungie.net/common/destiny2_content/icons/DestinyDamageTypeDefinition_b2fe51a94f3533f97079dfa0d27a4096.png"},a={47:"Chestplate",49:"Class Item",46:"Gauntlets",45:"Helmet",48:"Legs"},r=1!=e.type[1],l=document.createElement("div");l.addEventListener("click",()=>{showItemInfo(e)}),l.id=e.id,l.className="item hoverwrap",e.watermark?l.innerHTML=`<img src=${s+e.icon}><img src=${s+e.watermark}>`:l.innerHTML=`<img src=${s+e.icon}>`;let o=document.createElement("div");if(50!=e.type[1]){if(r){let c=`${e.name}`;n[e.rarity]&&(c+=`<br>${n[e.rarity]}`),manifests[4][e.type[0]].shortTitle&&(c+=` ${manifests[4][e.type[0]].shortTitle}`),a[e.type[1]]&&(c+=" "+a[e.type[1]]),l.title=c,o.innerHTML=`${e.light}`}else{let p=`${e.name}`;n[e.rarity]&&(p+=`<br>${n[e.rarity]}`),manifests[4][e.type[0]].shortTitle&&(p+=` ${manifests[4][e.type[2]].shortTitle}`),"s"==p[p.length-1]&&(p=p.substring(0,p.length-1)),l.title=p,0!=e.breakerType?o.innerHTML=`<img src=${breakers[e.breakerType]}><img src=${i[e.element]}> ${e.light}`:o.innerHTML=`<img src=${i[e.element]}> ${e.light}`}}o.className="info",l.appendChild(o);let d=document.createElement("div");return d.className="darken",d.style.pointerEvents="none",l.appendChild(d),l.setAttribute("draggable","true"),l.addEventListener("dragstart",s=>{let n=document.createElement("style");n.id="tempStyle",n.innerHTML=".item {pointer-events: none;}",document.body.appendChild(n);let i=document.getElementById(e.id).parentElement.id,a=document.getElementById(e.id).parentElement.id.split(".");console.log(`Transfer from: ${i}`),transferData[0]=e.hash,transferData[1]=1,transferData[2]=e.id,"equipped"==a[0]||"inventory"==a[0]?transferData[3]=a[2]:transferData[3]=void 0,transferData[4]=e.name,transferData[5]=t}),l.addEventListener("dragend",e=>{document.getElementById("tempStyle").remove()}),l},itemCompare=(e,t)=>{if(1!=e.type[1]&&1!=t.type[1]&&t.type[0]!=e.type[0])return t.type[0]-e.type[0];let s=t.light-e.light,n=t.rarity-e.rarity;return sort?0!=s?s:n:0!=n?n:s},onDrop=async e=>{let t=(transferDataCopy=JSON.parse(JSON.stringify(transferData)))[4];if("vault"==e.split(".")[0]||"inventory"==e.split(".")[0]){console.log("Transfer to: ",e),createNotification("Transfering Item: "+t,1500);let s=!1;if(transferDataCopy[3]&&"inventory"==e.split(".")[0]){let n=await transferItem(transferDataCopy[0],transferDataCopy[1],transferDataCopy[2],transferDataCopy[3],s=!0);if(200==n){let i=transferDataCopy[3];transferDataCopy[3]=e.split(".")[2],s=!1;let a=db.characters[i].inventory[e.split(".")[1]][transferDataCopy[5]];db.characters[i].inventory[e.split(".")[1]]=db.characters[i].inventory[e.split(".")[1]].slice(0,transferDataCopy[5]).concat(db.characters[i].inventory[e.split(".")[1]].slice(transferDataCopy[5]+1)),200==(n=await transferItem(transferDataCopy[0],transferDataCopy[1],transferDataCopy[2],transferDataCopy[3],s))?(createNotification("Transfered Item: "+t,1500),db.characters[transferDataCopy[3]].inventory[e.split(".")[1]].push(a)):(db.vault[e.split(".")[1]].push(a),createNotification("Item Transfer Failed!\n"+n.Message,1500)),sortVault()}else createNotification("Item Transfer Failed!\n"+n.Message,1500)}else{transferDataCopy[3]?s=!0:transferDataCopy[3]=e.split(".")[2];let r=await transferItem(transferDataCopy[0],transferDataCopy[1],transferDataCopy[2],transferDataCopy[3],s);if(200==r){if(createNotification("Transfered Item: "+t,1500),s){let l=db.characters[transferDataCopy[3]].inventory[e.split(".")[1]][transferDataCopy[5]];console.log(`db.characters.${transferDataCopy[3]}.inventory.${e.split(".")[1]}.${transferDataCopy[5]}`),db.characters[transferDataCopy[3]].inventory[e.split(".")[1]]=db.characters[transferDataCopy[3]].inventory[e.split(".")[1]].slice(0,transferDataCopy[5]).concat(db.characters[transferDataCopy[3]].inventory[e.split(".")[1]].slice(transferDataCopy[5]+1)),db.vault[e.split(".")[1]].push(l)}else{let o=db.vault[e.split(".")[1]][transferDataCopy[5]];console.log(`db.vault.${e.split(".")[1]}.${transferDataCopy[5]}`),db.vault[e.split(".")[1]]=db.vault[e.split(".")[1]].slice(0,transferDataCopy[5]).concat(db.vault[e.split(".")[1]].slice(transferDataCopy[5]+1)),db.characters[transferDataCopy[3]].inventory[e.split(".")[1]].push(o)}sortVault()}else createNotification("Item Transfer Failed!\n"+r.Message,1500)}let c=document.getElementsByClassName("ui-tooltip");for(let p=0;p<c.length;p++)c[p].remove()}},sortVault=()=>{let e=Object.keys(db.vault);for(let t=0;t<e.length;t++)db.vault[e[t]].sort(itemCompare);let s=document.getElementsByClassName("bucket");for(let n=0;n<s.length;n++){s[n].innerHTML="";let i="";for(let a=0;a<times.length;a++)i+="60px 175px ";i+="auto",s[n].style.gridTemplateColumns=i}document.getElementById("characters").innerHTML="";for(let r=0;r<times.length;r++){let l=times[r].id,o=db.characters[l],c=document.createElement("div");c.innerText=classTypes[o.class],c.style.backgroundImage=`url("https://www.bungie.net${o.emblemBig}")`,c.className="selector classes",document.getElementById("characters").appendChild(c);for(let p=0;p<s.length;p++){let d=s[p].id,m=document.createElement("div");m.className="equipped",m.id=`equipped.${d}.${l}`;let y=document.createElement("div");y.className="inventory",y.id=`inventory.${d}.${l}`,y.addEventListener("drop",e=>{e.preventDefault(),onDrop(`inventory.${d}.${l}`)}),y.addEventListener("dragover",e=>{e.preventDefault()});try{let h=itemToHTML(o.equipped[d][0]);m.appendChild(h),s[p].appendChild(m)}catch(u){console.log(`bucket id ${d} does not exist in character ${l} equipped!
Error: ${u}`)}o.inventory[d].sort(itemCompare);try{for(let f=0;f<o.inventory[d].length;f++){let g=itemToHTML(o.inventory[d][f],f);g.addEventListener("dblclick",async()=>{createNotification("Equipping: "+o.inventory[d][f].name,1500);let e=await equipItem(o.inventory[d][f].id,l);if(200==e){createNotification("Equipped: "+o.inventory[d][f].name,1500);let t=db.characters[l].equipped[d][0];db.characters[l].equipped[d][0]=o.inventory[d][f],o.inventory[d][f]=t,sortVault()}else createNotification("Failed to equip: "+o.inventory[d][f].name+"\n"+e.Message,1500);let s=document.getElementsByClassName("ui-tooltip");for(let n=0;n<s.length;n++)s[n].remove()}),y.appendChild(g)}s[p].appendChild(y)}catch(b){console.log(`bucket id ${d} does not exist in character ${l} inventory!
Error: ${b}`)}if(r==times.length-1){let $=document.createElement("div");$.className="vault",$.id=`vault.${d}`,$.addEventListener("drop",e=>{e.preventDefault(),onDrop(`vault.${d}`)}),$.addEventListener("dragover",e=>{e.preventDefault()});try{for(let v=0;v<db.vault[d].length;v++)$.appendChild(itemToHTML(db.vault[d][v],v));s[p].appendChild($)}catch(w){console.log(`bucket id ${d} does not exist in vault!
Error: ${w}`)}}}}},getVault=async()=>{createNotification("Refreshing inventory!",1500),times=[],db={characters:{},vault:{},iterableList:[]};let e=await (await fetch(baseURL+`${membershipType}/Profile/${membershipID}?components=102,200,201,205,206,300,301,302,304,305,310`,globalReq)).json();401==e.status&&(console.log("Vault refresh failed!\nRefreshing token\nResponse for debug:"+await e.text()),await refreshAccess()==200?getVault():createNotification("Access Token Expired! Please re-login."));let t=e.Response.characters.data,s=Object.keys(t);for(let n=0;n<s.length;n++){let i=s[n];times.push({time:new Date(t[i].dateLastPlayed).getTime(),id:i});let a={id:i,class:t[i].classType,equipped:{},loadouts:[],inventory:{},emblemSmall:t[i].emblemPath,emblemBig:t[i].emblemBackgroundPath};Object.keys(buckets).forEach(e=>{a.equipped[buckets[e]]=[],a.inventory[buckets[e]]=[]});let r=e.Response.characterEquipment.data[i].items;for(let l=0;l<r.length;l++)if(void 0!=r[l].itemInstanceId&&void 0!=buckets[r[l].bucketHash])try{let o=getItem(r[l].itemInstanceId,r[l].itemHash,e);o.bucket=buckets[r[l].bucketHash],db.iterableList.push(o);try{a.equipped[o.bucket].push(o)}catch{a.equipped[o.bucket]=[],a.equipped[o.bucket].push(o)}}catch(c){console.error(r[l].itemInstanceId,"  ",r[l].itemHash,"\n",c)}let p=e.Response.characterInventories.data[i].items;for(let d=0;d<p.length;d++)if(void 0!=p[d].itemInstanceId&&void 0!=buckets[p[d].bucketHash])try{let m=getItem(p[d].itemInstanceId,p[d].itemHash,e);m.bucket=buckets[p[d].bucketHash],db.iterableList.push(m);try{a.inventory[m.bucket].push(m)}catch{a.inventory[m.bucket]=[],a.inventory[m.bucket].push(m)}}catch(y){console.error(p[d].itemInstanceId,"  ",p[d].itemHash,"\n",y)}db.characters[i]=a}times.sort((e,t)=>t.time-e.time);let h=e.Response.profileInventory.data.items;Object.keys(buckets).forEach(e=>{db.vault[buckets[e]]=[]});for(let u=0;u<h.length;u++)if(void 0!=h[u].itemInstanceId)try{let f=getItem(h[u].itemInstanceId,h[u].itemHash,e);f.bucket=buckets[f.bucket],db.iterableList.push(f);try{db.vault[f.bucket].push(f)}catch{db.vault[f.bucket]=[],db.vault[f.bucket].push(f)}}catch{}sortVault()},transferItem=async(e,t,s,n,i)=>new Promise(async(a,r)=>{let l=JSON.parse(JSON.stringify(globalReq));l.method="POST",l.body=JSON.stringify({itemReferenceHash:e,stackSize:t,itemId:s,transferToVault:i,characterId:n,membershipType:membershipType});let o=await fetch(baseURL+"Actions/Items/TransferItem/",l);if(401==o.status)console.log("Transfer item failed!\nRefreshing token\nResponse for debug:"+await o.text()),await refreshAccess()==200?transferItem(e,t,i,s,n):createNotification("Access Token Expired! Please re-login.");else if(200==o.status)a(200);else{console.error("Something funky happened! (transferItem)\n",JSON.stringify(o),o);let c=await o.json();console.log(c),a(c)}}),equipItem=async(e,t)=>new Promise(async(s,n)=>{let i=JSON.parse(JSON.stringify(globalReq));i.method="POST",i.body=JSON.stringify({itemId:e,characterId:t,membershipType:membershipType});let a=await fetch(baseURL+"Actions/Items/EquipItem/",i);if(200==a.status)s(200);else if(401==a.status)console.log("Transfer item failed!\nRefreshing token\nResponse for debug:"+await a.text()),await refreshAccess()==200?equipItem(e,t):createNotification("Access Token Expired! Please re-login.");else{let r=await a.json();console.log(r),console.log(Object.keys(r)),s(r)}}),refreshTimer=async()=>{await new Promise(e=>setTimeout(e,45e3)),getVault(),refreshTimer()};!async function(){createNotification("Downloading latest information from Bungie!",1e3);let e=!1;for(;!e;)await refreshManifests()==200?(createNotification("Downloaded latest information from Bungie!",1500),e=!0):(createNotification("Failed trying again in three seconds!",3e3),await new Promise(e=>setTimeout(e,3e3)));let t={};try{membershipID=(t=(t=await (await fetch(baseURL+"254/Profile/"+accID+"/LinkedProfiles",globalReq)).json()).Response.profiles[0]).membershipId,membershipType=t.membershipType,displayName=t.displayName}catch{await refreshAccess()==200?(membershipID=(t=(t=await (await fetch(baseURL+"254/Profile/"+accID+"/LinkedProfiles",globalReq)).json()).Response.profiles[0]).membershipId,membershipType=t.membershipType,displayName=t.displayName):createNotification("Access Token Expired! Please re-login.")}await getVault()}();