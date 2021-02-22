
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

helper.parseIdToken = (idToken, nonce, done) => {
  const parsedJWT = jwt.decode(idToken, {complete: true});
  client.getSigningKey(parsedJWT.header.kid, (err, key) => {
    if (err) {  
      console.log("Key not found "+err);
      done(null);
    }
    let signingKey = key.getPublicKey();
    token = jwt.verify(idToken, signingKey);

    if (nonce !== token.nonce) {
      console.log("nonce doesn't match "+nonce +", "+token.nonce);
      done(null);
    }

    done(token);
  });
}

helper.parseJWT = (token, done) => {
  const parsedJWT = jwt.decode(token, {complete: true});
  client.getSigningKey(parsedJWT.header.kid, (err, key) => {
    if (err) {  
      console.log("Key not found "+err);
      done(null);
    }
    let signingKey = key.getPublicKey();
    token = jwt.verify(token, signingKey);

    done(token);
  });
}

module.exports = helper;

