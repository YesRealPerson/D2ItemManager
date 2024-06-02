const main = async () => {
    //Get parameters from URL
    const params = new URLSearchParams(window.location.search);
    //Send OAuth token request
    const response = JSON.parse(await (await fetch("https://d2oauth.spark952.workers.dev?code=" + params.get("code"))).text());
    
    console.log(response);
}
main();