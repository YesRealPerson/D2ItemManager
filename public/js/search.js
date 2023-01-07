/*
SYNTAX

Searching by name
name={name}

Searching by perk
perk={perk name}

Searching by stat
stat={stat name}{>,==,<}{value}

Searching by rarity
rarity={exotic,legendary,rare,uncommon,common}

Searching by type
type={hand cannon, sniper, helmet, boots, etc}

Searching by ammo type
ammo={heavy, special, primary}

Multiple keywords can be used, but they must be separated by commas and nothing more

EXAMPLE INPUT
type=hand cannon,rarity=legendary,stat=range>60,perk=eye of the storm
*/
const search = (query) => {
    let cTime = new Date().getTime() + "search";
    let error = false;
    let results = [6917529849398925653];
    query = query.toLowerCase();
    query = query.split(",");
    // query.forEach(async keyword => {
    //     keyword = keyword.split("=");
    //     switch (keyword[0]) {
    //         case "name":
    //             results = nameSearch(keyword[1]);
    //             break;
    //         case "perk":
    //             results = perkSearch(keyword[1]);
    //             break;
    //         case "stat":
    //             results = statSearch(keyword[1]);
    //             break;
    //         case "rarity":
    //             results = raritySearch(keyword[1]);
    //             break;
    //         case "type":
    //             results = typeSearch(keyword[1]);
    //             break;
    //         case "ammo":
    //             results = ammoSearch(keyword[1]);
    //             break;
    //         default:
    //             error = true;
    //             break;
    //     }
    //     if (error) {
    //         keyword = "";
    //         var message = document.createElement("p");
    //         message.innerHTML = "Your search could not be parsed";
    //         message.setAttribute("id", cTime);
    //         message.setAttribute("class", "message");
    //         document.getElementById("status").appendChild(message);
    //         await new Promise(r => setTimeout(r, 2500));
    //         document.getElementById(cTime).remove();
    //         return;
    //     }
    // });
    let items = document.getElementsByClassName("hoverwrap");
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (results.indexOf(item.id) == -1) {
            item.lastElementChild.style.backgroundColor = "background-color: rgba(0, 0, 0, 0.5);";
        }
    }
    return(results);
}