
const axios = require('axios');
const FormData = require('form-data');
const config = require('./config');
const { promisify } = require('util');

const common = {};

const jwksUri = config.authServerUrl+'/.well-known/jwks.json';

const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const client = jwksClient({
  strictSsl: true, // Default value
  jwksUri: jwksUri,
  requestHeaders: {}, // Optional
  requestAgentOptions: {}, // Optional
  timeout: 30000, // Defaults to 30s
});

common.parseJWT = async (unverifiedToken, nonce) => {
  const parsedJWT = jwt.decode(unverifiedToken, {complete: true});
  const getSigningKey = promisify(client.getSigningKey).bind(client);
  let signingKey = await getSigningKey(parsedJWT.header.kid);
  let publicKey = signingKey.getPublicKey();
  try {
    const token = jwt.verify(unverifiedToken, publicKey, { audience: config.clientId, issuer: config.issuer });
    if (nonce) {
      if (nonce !== token.nonce) {
        console.log("nonce doesn't match "+nonce +", "+token.nonce);
        return null;
      }
    }
    return token;
  } catch(err) {
    console.log(err);
    throw err;
  }
}

common.refreshJWTs = async (refreshToken) => {
  console.log("refreshing.");
  // POST refresh request to Token endpoint
  const form = new FormData();
  form.append('client_id', config.clientId);
  form.append('grant_type', 'refresh_token');
  form.append('refresh_token', refreshToken);
  const authValue = 'Basic ' + Buffer.from(config.clientId +":"+config.clientSecret).toString('base64');
  const response = await axios.post(config.authServerUrl+'/oauth2/token', form, { 
      headers: { 
         'Authorization' : authValue,
         ...form.getHeaders()
      } });

  const accessToken = response.data.access_token;
  const idToken = response.data.id_token;
  const refreshedTokens = {};
  refreshedTokens.accessToken = accessToken;
  refreshedTokens.idToken = idToken;
  return refreshedTokens;

}

common.validateToken = async function (accessToken, clientId) {

  const form = new FormData();
  form.append('token', accessToken);
  form.append('client_id', clientId); // FusionAuth requires this for authentication
 
  try {
    const response = await axios.post(config.authServerUrl+'/oauth2/introspect', form, { headers: form.getHeaders() });
    if (response.status === 200) {
      return response.data.active;
    }
  } catch (err) {
    console.log(err);
  }

  return false;
}

common.retrieveUser = async function (accessToken) {
  const response = await axios.get(config.authServerUrl + '/oauth2/userinfo', { headers: { 'Authorization' : 'Bearer ' + accessToken } });
  try {
    if (response.status === 200) {
      return response.data;
    }

    return null;
  } catch (err) {
    console.log(err);
  }
  return null;
}

common.getTodos = () => {
  // pull from the database
  todos = [];
  todos.push({'task': 'Get milk', 'done' : true});
  todos.push({'task': 'Read OAuth guide', 'done' : false});
  return todos;
}

common.authorizationCheck = async (req, res) => {
  const accessToken = req.cookies.access_token;
  const refreshToken = req.cookies.refresh_token;
  try {
    let jwt = await common.parseJWT(accessToken);
    return true;
  } catch (err) { 
    if (err.name === "TokenExpiredError") {
      const refreshedTokens = await common.refreshJWTs(refreshToken);

      const newAccessToken = refreshedTokens.accessToken;
      const newIdToken = refreshedTokens.idToken;
  
      // update our cookies
      console.log("updating our cookies");
      res.cookie('access_token', newAccessToken, {httpOnly: true, secure: true});
      res.cookie('id_token', newIdToken); // Not httpOnly or secure
     
      // subsequent parts of processing this request may pull from cookies, so if we refreshed, update them
      req.cookies.access_token = newAccessToken;
      req.cookies.id_token = newIdToken;

      try {
        let newJwt = await common.parseJWT(newAccessToken);
        return true;
      } catch (err2) {
        console.log(err2);
        return false;
      }
    } else {
      console.log(err);
    }
    return false;
  }
}

module.exports = common;

