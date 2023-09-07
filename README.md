Recreation of DIM for fun

Do not use this on a public server, your oauth keys have no protection because I am too lazy to implement it.

# How to use

1. Create a .env file
2. Create two entries XAPI and BASIC
3. Create an app on the Bungie developer portal
4. Set your Redirect URL to https://localhost/oauth/redirect
5. Ensure your OAuth Client Type is set to confidential
6. Give your app permission to move and read character data
7. Put your API Key under XAPI
8. Encode your OAuth client_id and OAuth client_secret as {client}:{secret} into base64
9. Put your base64 string under BASIC
10. Generate your SSL certificate and key (name them cert.pem and key.pem)
11. Run run.bat

Sorry if it sucks, just use DIM.

# Dependencies

NodeJS

Express

Axios

HTTPS

open