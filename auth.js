//Get parameters from URL
const params = new URLSearchParams(window.location.search);
//Send OAuth token request
const response = await fetch("https://d2oauth.spark952.workers.dev?code="+params.get("code"));

console.log(response);