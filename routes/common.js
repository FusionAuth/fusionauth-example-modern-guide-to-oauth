
const axios = require('axios');
const FormData = require('form-data');
const config = require('./config');

const helper = {};

const jwksUri = 'https://local.fusionauth.io/.well-known/jwks.json';

const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const client = jwksClient({
  strictSsl: true, // Default value
  jwksUri: jwksUri,
  requestHeaders: {}, // Optional
  requestAgentOptions: {}, // Optional
  timeout: 30000, // Defaults to 30s
});

helper.parseJWT = (unverifiedToken, refreshToken, done, nonce) => {
  const parsedJWT = jwt.decode(unverifiedToken, {complete: true});
  client.getSigningKey(parsedJWT.header.kid, (err, key) => {
    if (err) {  
      console.log("Key not found "+err);
      done(null);
    }
    let signingKey = key.getPublicKey();
    let token = {};
    try {
      token = jwt.verify(unverifiedToken, signingKey, { audience: config.clientId, issuer: config.issuer });
      if (nonce) {
        if (nonce !== token.nonce) {
          console.log("nonce doesn't match "+nonce +", "+token.nonce);
          done(null);
        }
      }
  
      done(token);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        console.log("need to refresh");
        refreshJWTs(refreshToken, done);
      } else {
        console.log("Some other error");
        console.log(err);
      }
    }
  });
}

refreshJWTs = (refreshToken, done) => {
  // POST refresh request to Token endpoint
  const form = new FormData();
  form.append('client_id', config.clientId);
  form.append('grant_type', 'refresh_token');
  form.append('refresh_token', refreshToken);
  const authValue = 'Basic ' + Buffer.from(config.clientId +":"+config.clientSecret).toString('base64');
  axios.post('https://local.fusionauth.io/oauth2/token', form, { 
      headers: { 
         'Authorization' : authValue,
         ...form.getHeaders()
      } })
    .then((response) => {
      const accessToken = response.data.access_token;
      const idToken = response.data.id_token;
      const refreshToken = response.data.refresh_token;
      console.log(accessToken);
      console.log(idToken);
      console.log(refreshToken);
      helper.parseJWT(accessToken, refreshToken, done);
    }).catch((err) => {console.log("in error"); console.error(JSON.stringify(err));});

}

module.exports = helper;

