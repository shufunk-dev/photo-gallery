const fs = require('fs');
const path = require('path');

const API_URL = 'https://wiki.shufeltdesigns.com/api.php';
const USERNAME = process.env.WIKI_USERNAME;
const PASSWORD = process.env.WIKI_PASSWORD;

if (!USERNAME || !PASSWORD) {
  console.error("Missing WIKI_USERNAME or WIKI_PASSWORD in .env file");
  process.exit(1);
}

// MediaWiki API requires cookies to maintain session across requests
let cookies = [];

function extractCookies(headers) {
  const setCookie = headers.getSetCookie ? headers.getSetCookie() : headers.raw && headers.raw()['set-cookie'];
  if (setCookie) {
    setCookie.forEach(c => cookies.push(c.split(';')[0]));
  }
}

async function apiRequest(params, isPost = false) {
  const url = new URL(API_URL);
  url.searchParams.append('format', 'json');
  
  let options = {
    method: isPost ? 'POST' : 'GET',
    headers: {}
  };

  if (cookies.length > 0) {
    options.headers['Cookie'] = cookies.join('; ');
  }

  if (isPost) {
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      formData.append(key, value);
    }
    options.body = formData;
    options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
  } else {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value);
    }
  }

  const response = await fetch(url, options);
  extractCookies(response.headers);
  const data = await response.json();
  
  if (data.error) {
    throw new Error(`MediaWiki API Error: ${data.error.info}`);
  }
  return data;
}

async function run() {
  try {
    console.log("1. Fetching login token...");
    let data = await apiRequest({ action: 'query', meta: 'tokens', type: 'login' });
    const loginToken = data.query.tokens.logintoken;

    console.log("2. Logging in...");
    data = await apiRequest({
      action: 'login',
      lgname: USERNAME,
      lgpassword: PASSWORD,
      lgtoken: loginToken
    }, true);
    
    if (data.login.result !== 'Success') {
      throw new Error(`Login failed: ${data.login.reason || data.login.result}`);
    }

    console.log("3. Fetching CSRF token for editing...");
    data = await apiRequest({ action: 'query', meta: 'tokens' });
    const csrfToken = data.query.tokens.csrftoken;

    console.log("4. Reading local documentation...");
    const readmeContent = fs.readFileSync(path.join(__dirname, '../README.md'), 'utf-8');
    
    const wikiContent = `<!-- AUTO-GENERATED FROM GITHUB README -->\n\n` + readmeContent;

    console.log("5. Pushing content to Wiki page 'Photo_Gallery'...");
    data = await apiRequest({
      action: 'edit',
      title: 'Photo_Gallery',
      text: wikiContent,
      token: csrfToken,
      bot: true
    }, true);

    if (data.edit && data.edit.result === 'Success') {
      console.log("Successfully updated the wiki page: https://wiki.shufeltdesigns.com/index.php/Photo_Gallery");
    } else {
      console.error("Failed to edit:", data);
    }

  } catch (err) {
    console.error("Execution failed:", err.message);
  }
}

run();
