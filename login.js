document.getElementById('log').addEventListener("click", () => {
    // generate randomized state parameter
    let state = Math.floor((Math.random*1000000));
    // Redirect to bungie auth page
    window.location.href = "https://www.bungie.net/en/OAuth/Authorize?client_id=40053&responsetype=code&state="+state;
})