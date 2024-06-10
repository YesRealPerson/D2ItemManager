// API for handling notification messages

// Element where all notifications are pushed to
const statusElement = document.getElementById("status");
let timeouts = [];

const messageLoop = async () => {
    while(timeouts.length > 0){
        await new Promise(r => setTimeout(r, timeouts[0]));
        statusElement.firstElementChild.remove();
        timeouts.shift();
    }
    // Nuke any notifications that somehow get left behind, which shouldn't be possible but IDK
    statusElement.innerHTML = "";
}

/* 
Creates a notification
message: Displayed message
timeout: time to display message (millis)
*/
const createNotification = (message, timeout) => {
    const element = document.createElement("div");
    element.className = "message";
    element.innerText = message;
    statusElement.appendChild(element);
    timeouts.push(timeout);

    //if timeout array is empty then assume recursive loop is not running, else start recursive loop
    if(timeouts.length > 0){
        messageLoop();
    }
}