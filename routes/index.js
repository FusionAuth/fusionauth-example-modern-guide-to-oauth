// Dependencies
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const FormData = require('form-data');
const common = require('./common');
const config = require('./config');

// Route and OAuth variables
const router = express.Router();
const clientId = config.clientId;
const clientSecret = 'CmW5LwOKNrqFNHfEF8O8gLhMXAHP4sz2Gm4PEm6baNA';
const redirectURI = encodeURI('http://localhost:3000/oauth-callback');
const scopes = encodeURIComponent('profile offline_access openid');

// Crypto variables
const password = 'setec-astronomy'
const key = crypto.scryptSync(password, 'salt', 24);
const iv = crypto.randomBytes(16);

router.get('/', (req, res, next) => {
  res.render('index', {title: 'FusionAuth Example'});
});

router.get('/login', (req, res, next) => {
  const state = generateAndSaveState(req, res);
  const codeChallenge = generateAndSaveCodeChallenge(req, res);
  const nonce = generateAndSaveNonce(req, res);
  res.redirect(302,
               'https://local.fusionauth.io/oauth2/authorize?' +
                 `client_id=${clientId}&` +
                 `redirect_uri=${redirectURI}&` +
                 `state=${state}&` +
                 `response_type=code&` +
                 `scope=${scopes}&` +
                 `code_challenge=${codeChallenge}&` +
                 `code_challenge_method=S256&` +
                 `nonce=${nonce}`);
});

router.get('/oauth-callback', (req, res, next) => {
  // Verify the state
  const reqState = req.query.state;
  const state = restoreState(req, res);
  if (reqState !== state) {
    res.redirect('/', 302); // Start over
    return;
  }
  
  const code = req.query.code;
  const codeVerifier = restoreCodeVerifier(req, res);
  const nonce = restoreNonce(req, res);

  // POST request to Token endpoint
  const form = new FormData();
  form.append('client_id', clientId);
  form.append('client_secret', clientSecret)
  form.append('code', code);
  form.append('code_verifier', codeVerifier);
  form.append('grant_type', 'authorization_code');
  form.append('redirect_uri', redirectURI);
  axios.post('https://local.fusionauth.io/oauth2/token', form, { headers: form.getHeaders() })
    .then((response) => {
      const accessToken = response.data.access_token;
      const idToken = response.data.id_token;
      const refreshToken = response.data.refresh_token;

      // Parse and verify the ID token (it's a JWT and once verified we can just store the body)
      if (idToken) {
        let user = null;
        common.parseIdToken(idToken, nonce, (token) => { 
          user = token;
          if (!user) {
            console.log('Nonce is bad. It should be ' + nonce + ' but was ' + idToken.nonce);
            res.redirect(302,"/"); // Start over
            return;
          }
        });
      }


      // Since the different OAuth modes handle the tokens differently, we are going to
      // put a placeholder function here. We'll discuss this function in the following
      // sections
      handleTokens(accessToken, idToken, refreshToken, res);
    });
});

// Helper method for Base 64 encoding that is URL safe
function base64URLEncode(str) {
  return str.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function sha256(buffer) {
  return crypto.createHash('sha256')
    .update(buffer)
    .digest();
}

function encrypt(value) {
  const cipher = crypto.createCipheriv('aes-192-cbc', key, iv);
  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted + ':' + iv.toString('hex');
}

function decrypt(value) {
  const parts = value.split(':');
  const cipherText = parts[0];
  const iv = Buffer.from(parts[1], 'hex');
  const decipher = crypto.createDecipheriv('aes-192-cbc', key, iv);
  let decrypted = decipher.update(cipherText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function generateAndSaveState(req, res) {
  const state = base64URLEncode(crypto.randomBytes(64));
  res.cookie('oauth_state', encrypt(state), {httpOnly: true});
  return state;
}

function generateAndSaveCodeChallenge(req, res) {
  const codeVerifier = base64URLEncode(crypto.randomBytes(64));
  res.cookie('oauth_code_verifier', encrypt(codeVerifier), {httpOnly: true});
  return base64URLEncode(sha256(codeVerifier));
}

function generateAndSaveNonce(req, res) {
  const nonce = base64URLEncode(crypto.randomBytes(64));
  res.cookie('oauth_nonce', encrypt(nonce), {httpOnly: true});
  return nonce;
}

function restoreState(req, res) {
  const value = decrypt(req.cookies.oauth_state);
  res.clearCookie('oauth_state');
  return value;
}

function restoreCodeVerifier(req, res) {
  const value = decrypt(req.cookies.oauth_code_verifier);
  res.clearCookie('oauth_code_verifier');
  return value;
}

function restoreNonce(req, res) {
  const value = decrypt(req.cookies.oauth_nonce);
  res.clearCookie('oauth_nonce');
  return value;
}

function handleTokens(accessToken, idToken, refreshToken, res) {
  //console.log(accessToken);
  //console.log(idToken);
  //console.log(refreshToken);

  // Write the tokens as cookies
  res.cookie('access_token', accessToken, {httpOnly: true, secure: true});
  res.cookie('id_token', idToken); // Not httpOnly or secure
  res.cookie('refresh_token', refreshToken, {httpOnly: true, secure: true});

  // Redirect to the To-do list
  res.redirect(302, '/todos');

}

module.exports = router;
