/* 
Creates a notification
message: Displayed message
timeout: time to display message (millis)
*/
const statusElement = document.getElementById("status");
const createNotification = async (message, timeout) => {
    const element = document.createElement("div");
    element.className = "message";
    element.innerText = message;
    element.style.opacity = "0%";
    statusElement.appendChild(element);
    for(let i = 0; i <= 100; i += 5){
        element.style.opacity = i + "%";
        await new Promise(r => setTimeout(r, 1));
    }
    await new Promise(r => setTimeout(r, timeout));
    for(let i = 100; i >= 0; i -= 5){
        element.style.opacity = i + "%";
        await new Promise(r => setTimeout(r, 1));
    }
    element.remove();
}

// TEST CODE
// (async function () {for(let i = 0; i < 5; i++){createNotification(i, 2500); await new Promise(r => setTimeout(r, 100));}})(); 