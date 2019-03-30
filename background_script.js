async function getDb(){
  let t;
  try {
    t = JSON.parse((await browser.storage.local.get("db")).db);
  } catch(e) {
    t = [];
  }
  return t;
}

function setDb(array){
  browser.storage.local.set({"db": JSON.stringify(array)});
}

async function addToDb(obj){
  let entries = await getDb();
  entries.push(obj);
  setDb(entries);
}

browser.tabs.onUpdated.addListener(async (tabId) => {
  let tab = await browser.tabs.get(tabId);
  let window = await browser.windows.get(tab.windowId);
  await tabActivated(window, tab);
}, {'urls': ['<all_urls>']});

browser.windows.onFocusChanged.addListener(async (windowId) => {
  if(windowId == -1){
    pageDeactivated();
    return;
  }
  let tab, window;
  try {
    [tab, window] = await Promise.all([browser.tabs.query({"active": true, "windowId": windowId}), browser.windows.get(windowId)]);
    tab = tab[0];
  } catch(e) {
    console.error(String(e));
    return;
  }
  if(!tab || !window) return;
  await tabActivated(window, tab);
});

browser.tabs.onActivated.addListener(async (tabInfo) => {
  let [tab, window] = await Promise.all([browser.tabs.get(tabInfo.tabId), browser.windows.get(tabInfo.windowId)]);
  await tabActivated(window, tab);
});

async function tabActivated(window, tab){
  if(window.focused && tab.active){
   await pageActivated(tab.url);
  }
}

// todo tab close

async function pageActivated(url){
  let lastUrlStartTime = browser.storage.local.get("lastUrlStartTime").lastUrlStartTime;
  let time = Math.floor((+new Date())/1000);
  if(time == lastUrlStartTime) return;

  await pageDeactivated();
  browser.storage.local.set({"lastUrl": url});
  browser.storage.local.set({"lastUrlStartTime": time});
  console.log("Page activated:", url);
}

async function pageDeactivated(url){
  if(!url) url = (await browser.storage.local.get("lastUrl")).lastUrl;

  let [lastUrl, lastUrlStartTime] = await Promise.all([browser.storage.local.get("lastUrl"), browser.storage.local.get("lastUrlStartTime")]);
  [lastUrl, lastUrlStartTime] = [lastUrl.lastUrl, lastUrlStartTime.lastUrlStartTime];
  if(url != lastUrl || !lastUrl) return;

  let urlTime = Math.floor(+new Date()/1000) - lastUrlStartTime;
  
  if(!urlTime) return;
  console.log("Page deactivated:", url);
  console.log("Page was active for:", urlTime);
  
  browser.storage.local.set({"lastUrl": ""});
  
  addToDb([url, +lastUrlStartTime, urlTime]);
}
