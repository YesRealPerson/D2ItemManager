let response = "";
const main = async () => {
    //Get parameters from URL
    const params = new URLSearchParams(window.location.search);
    try {
        //Send OAuth token request
        response = await fetch("https://d2oauth.spark952.workers.dev?code=" + params.get("code"));
        response = JSON.parse(await response.json());

        //Store tokens and ID inside of local storage
        if(!response.access_token || !response.refresh_token || !response.membership_id){
            document.body.innerText = "Authentication failed!\nError:\n" + response.error + "\n" + response.error_description;
        }else{
            localStorage.setItem("access", response.access_token);
            localStorage.setItem("refresh", response.refresh_token);
            localStorage.setItem("accountID", response.membership_id);
            //Redirect to app page assuming no errors have occured
            window.location.href = "./app"
        }
    } catch (err) {
        document.body.innerText = "Authentication failed!\nError:\n" + err;
    }
}
main();