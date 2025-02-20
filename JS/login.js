const generateState = () => {
    let state = "";
    let possible = "QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm1234567890";
    for(let i = 0; i < 20; i++){
        state += possible.charAt(Math.floor(Math.random()*possible.length))
    }
    return state;
}

document.getElementById('log').addEventListener("click", () => {
    // generate randomized state parameter
    let state = generateState();
    // Redirect to bungie auth page
    window.location.href = "https://www.bungie.net/en/OAuth/Authorize?client_id=47120&response_type=code&state="+state;
})