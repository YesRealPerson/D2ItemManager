/*
EXAMPLE INPUT
family=hand cannon,type=kinetic,stat=range>50,perk=eye of the storm
*/

//format query then pass to filter
const search = (query) => {
    cleanseCSS();
    if (query != "") {
        query = query.toLowerCase();
        let temp = query.split(",");
        let tags = [];
        temp.forEach(tag => {
            tag = tag.split(":");
            tags.push([tag[0], tag[1]]);
        });
        filter(tags);
    }
}

//filter results
const filter = (tags) => {
    let keys = Object.keys(vault);
    for (let i = keys.length - 1; i >= 0; i--) {
        let item = vault[keys[i]];
        tags.forEach(tag => {
            if (tag[0] == "family") {
                if (tag[1] == "smg") {
                    tag[1] = "submachine gun";
                }
                else if (tag[1] == "lfr") {
                    tag[1] = "linear fusion rifle";
                }
                else if (tag[1] == "hc") {
                    tag[1] = "hand cannon";
                }
            }

            if (tag[0] == "stat") {
                try {
                    if (tag[1].indexOf(">") != -1) {
                        let stats = item.stats;
                        let found = false;
                        for (let j = 0; j < stats.length; j++) {
                            let stat = stats[j];
                            let values = tag[1].split(">");
                            values[1] = parseInt(values[1]);
                            let test = Object.keys(stat)[0].toLowerCase();
                            if (values[0] == "rpm") { values[0] = "rounds per minute"; }
                            else if (values[0] == "ae") { values[0] = "airborne effectiveness"; }
                            if (test == values[0]) {
                                if (stat[Object.keys(stat)[0]].value >= values[1]) {
                                    found = true;
                                    break;
                                }
                            }
                        }
                        if (!found) {
                            keys[i] = "";
                        }
                    } else if (tag[1].indexOf("<") != -1) {
                        let stats = item.stats;
                        let found = false;
                        for (let j = 0; j < stats.length; j++) {
                            let stat = stats[j];
                            let values = tag[1].split("<");
                            values[1] = parseInt(values[1]);
                            let test = Object.keys(stat)[0].toLowerCase();
                            if (values[0] == "rpm") { values[0] = "rounds per minute"; }
                            else if (values[0] == "ae") { values[0] = "airborne effectiveness"; }
                            if (test == values[0]) {
                                if (stat[Object.keys(stat)[0]].value <= values[1]) {
                                    found = true;
                                    break;
                                }
                            }
                        }
                        if (!found) {
                            keys[i] = "";
                        }
                    } else if (tag[1].indexOf("=" != -1)) {
                        let stats = item.stats;
                        let found = false;
                        for (let j = 0; j < stats.length; j++) {
                            let stat = stats[j];
                            let values = tag[1].split("=");
                            values[1] = parseInt(values[1]);
                            let test = Object.keys(stat)[0].toLowerCase();
                            if (values[0] == "rpm") { values[0] = "rounds per minute"; }
                            else if (values[0] == "ae") { values[0] = "airborne effectiveness"; }
                            if (test == values[0]) {
                                if (stat[Object.keys(stat)[0]].value == values[1]) {
                                    found = true;
                                    break;
                                }
                            }
                        }
                        if (!found) {
                            keys[i] = "";
                        }
                    } else {
                        keys[i] = "";
                        console.log("invalid input!");
                    }
                } catch (err) { keys[i] = ""; }
            }
            else if (tag[0] == "perk") {
                try {
                    let perks = item.perks;
                    let found = false;
                    for (let j = 0; j < perks.length; j++) {
                        let name = perks[j].name.toLowerCase();
                        if (name.indexOf(tag[1]) != -1) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        keys[i] = "";
                    }
                } catch (err) { keys[i] = ""; }
            } else if(tag[0] == "tag") {
                try{
                    let tags = item.tags;
                    if(tags.length == 0) keys[i] = "";
                    for(let m = 0; m < tags.length; m++){
                        if(tags[m] != tag[1]){
                            keys[i] = "";
                            break;
                        }
                    }
                }catch (err) { keys[i] = ""; }
            }
            else if (tag[0] == "light") {
                let l1 = item.light;
                let l2 = parseInt(tag[1].substring(1));
                if (tag[1][0] == ">") {
                    if (l1 < l2) {
                        keys[i] = "";
                    }
                } else if (tag[1][0] == "<") {
                    if (l1 > l2) {
                        keys[i] = "";
                    }
                } else if (tag[1][0] == "=") {
                    if (l1 != l2) {
                        keys[i] = "";
                    }
                } else {
                    keys[i] = "";
                }
            } 
            else if (tag[0] == "breaker") {
                let champion = item.champion;
                let champions = {
                    "barrier": 1,
                    "unstop": 3,
                    "unstoppable": 3,
                    "overload": 2,
                    "over": 2
                }
                try{
                    if(champions[tag[1].toLowerCase()]!=champion){
                        keys[i] = "";
                    }
                }catch{
                    keys[i] = "";
                }
            } else {
                try {
                    let toCheck = item[tag[0]].toLowerCase();
                    if (toCheck.indexOf(tag[1]) == -1) {
                        keys[i] = "";
                    }
                } catch (err) {
                    // console.log(err);
                    keys[i] = "";
                }
            }
        });
    }

    createStyle(keys);
}

//create style element
const createStyle = (exempt) => {
    document.documentElement.style.setProperty(`--opacity`, '0.75');
    exempt.forEach(id => {
        try {
            if (id != "") { document.getElementById(id).style.setProperty(`--opacity`, '0'); }
        } catch { }
    })
}