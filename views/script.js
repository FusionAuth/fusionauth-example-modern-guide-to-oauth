axios.get('/api/todos')
  .then(function (response) {
    buildUI(response.data);
    buildClickHandler();
  })
  .catch(function (error) {
    // handle error
    console.log(error);
    window.location.href="/";
  });

function buildUI(data) {
  const todos = data;
  const id_token = Cookies.get('id_token');
  var decoded = jwt_decode(id_token);
  const email = decoded.email;
  const title = 'Todo list';
  var html = `
    <h1>${title}</h1><p>Todos for ${email}</p>
    <table>
    <tr><th>Task</th><th>Complete</th></tr>
  `;
  todos.forEach(val => {
    var checked = '';
    if (val.done){ 
      checked = 'checked'
    }
    html += `<tr><td>${val.task}</td><td><input type='checkbox' class='chk' ${checked} data-id='${val.id}'></td></tr>`;
  });
  html = html + `</table>`;

  document.getElementById('content').innerHTML = html;
}

function buildClickHandler() {
  document.addEventListener('click', function (event) {

    // If the clicked element doesn't have the right selector, bail
    if (!event.target.matches('.chk')) return;

    // Log the clicked element in the console
    const completed = event.target.checked
    const id = event.target.dataset.id
    if (completed) {
      axios.post('/api/todos/complete/'+id, {})
      .then(function (response) {
        console.log(response);
      })
      .catch(function (error) {
        console.log(error);
      });
    }
  }, false);
}

const refreshJWTs = async (refreshToken) => {
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
