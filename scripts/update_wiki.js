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

function markdownToWikitext(md) {
  let wt = md;
  // Headers
  wt = wt.replace(/^### (.*$)/gim, '=== $1 ===');
  wt = wt.replace(/^## (.*$)/gim, '== $1 ==');
  wt = wt.replace(/^# (.*$)/gim, '= $1 =');
  // Bold
  wt = wt.replace(/\*\*(.*?)\*\*/g, "'''$1'''");
  // Italic (ignoring lists for simple regex)
  wt = wt.replace(/(?<!^)\*(.*?)\*(?!$)/gim, "''$1''");
  // Links
  wt = wt.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '[$2 $1]');
  return wt;
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
    const mdContent = fs.readFileSync(path.join(__dirname, '../docs/manual.md'), 'utf-8');
    const wikitextContent = markdownToWikitext(mdContent);

    console.log("5. Pushing Manual to Wiki page 'Photo Gallery: User Manual'...");
    data = await apiRequest({
      action: 'edit',
      title: 'Photo Gallery: User Manual',
      text: wikitextContent + '\n\n[[Category:Photo Album Organizer]]',
      token: csrfToken,
      bot: true
    }, true);

    if (data.edit && data.edit.result === 'Success') {
      console.log("Successfully updated the manual page!");
    } else {
      console.error("Failed to edit manual:", data);
    }

    console.log("6. Fetching Main_Page...");
    data = await apiRequest({
      action: 'query',
      prop: 'revisions',
      titles: 'Main_Page',
      rvprop: 'content',
      rvslots: 'main'
    });

    let mainPageContent = '';
    for (let p in data.query.pages) {
      mainPageContent = data.query.pages[p].revisions[0].slots.main['*'];
    }

    const sectionParts = mainPageContent.split('=== Photo Album Organizer ===');
    if (sectionParts.length === 2) {
      const sectionAfter = sectionParts[1];
      const placeholderRegex = /\*\s*''Documentation pages are currently being prepared\.''/;
      
      if (placeholderRegex.test(sectionAfter)) {
        console.log("7. Placeholder found. Updating Main_Page...");
        const updatedAfter = sectionAfter.replace(placeholderRegex, '* [[Photo Gallery: User Manual|User Manual]]\n* Browse all pages in [[:Category:Photo Album Organizer]]');
        const updatedContent = sectionParts[0] + '=== Photo Album Organizer ===' + updatedAfter;
        
        data = await apiRequest({
          action: 'edit',
          title: 'Main_Page',
          text: updatedContent,
          token: csrfToken,
          bot: true
        }, true);
        
        if (data.edit && data.edit.result === 'Success') {
          console.log("Successfully updated the Main_Page!");
        }
      } else {
        console.log("7. Placeholder already replaced or not found in this section. Skipping Main_Page update.");
      }
    } else {
      console.log("7. Photo Album Organizer section not found. Skipping Main_Page update.");
    }

  } catch (err) {
    console.error("Execution failed:", err.message);
  }
}

run();
