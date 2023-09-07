var link = document.getElementById("link");
var hash = CryptoJS.SHA1(new Date().getTime());
link.setAttribute("href", "https://www.bungie.net/en/oauth/authorize?client_id=40053&response_type=code&state="+hash);