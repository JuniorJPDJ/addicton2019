async function getDb(){
  let t;
  try {
    t = JSON.parse((await browser.storage.local.get("db")).db);
  } catch(e) {
    t = [];
  }
  return t;
}

async function setDb(array){
  await browser.storage.local.set({"db": JSON.stringify(array)});
}

async function addToDb(obj){
  let entries = await getDb();
  entries.push(obj);
  await setDb(entries);
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
  await browser.storage.local.set({"lastTab": tab.id});
  if(window.focused && tab.active){
   await pageActivated(tab.url);
  }
}

async function pageActivated(url){
  let lastUrlStartTime = (await browser.storage.local.get("lastUrlStartTime")).lastUrlStartTime;
  let time = +new Date()/1000;
  if((time - lastUrlStartTime) < 1) return;

  await pageDeactivated();
  await browser.storage.local.set({"lastUrl": url});
  await browser.storage.local.set({"lastUrlStartTime": time});
  console.log("Page activated:", url);
}

async function pageDeactivated(url){
  if(!url) url = (await browser.storage.local.get("lastUrl")).lastUrl;

  let [lastUrl, lastUrlStartTime] = await Promise.all([browser.storage.local.get("lastUrl"), browser.storage.local.get("lastUrlStartTime")]);
  [lastUrl, lastUrlStartTime] = [lastUrl.lastUrl, lastUrlStartTime.lastUrlStartTime];
  if(url != lastUrl || !lastUrl) return;

  let urlTime = +new Date()/1000 - lastUrlStartTime;
  
  if(urlTime < 1) return;
  console.log("Page deactivated:", url);
  console.log("Page was active for:", urlTime);
  
  await browser.storage.local.set({"lastUrl": ""});
  
  addToDb([url, Math.floor(+lastUrlStartTime), Math.floor(urlTime)]);
}
