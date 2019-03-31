(function() {
browser.runtime.onMessage.addListener(async (message) => {
    if (message.command === "popup") {
        await browser.tabs.executeScript({file: "/content_scripts/content_script.js"});
        let activeTab = await browser.tabs.query({active: true});
        console.log(activeTab[0].id);
        browser.tabs.sendMessage( activeTab[0].id, {
            command: "popup",
            num: "1",
        });
    }
});
})();

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

async function getActiveTab(){
  let currentWindow = await browser.windows.getCurrent();
  let currentTab = (await browser.tabs.query({"active": true, "windowId": currentWindow.id}))[0];
  return currentTab;
}

async function timeOnActiveTab(){ 
  let [lastUrl, lastUrlStartTime] = await Promise.all([browser.storage.local.get("lastUrl"), browser.storage.local.get("lastUrlStartTime")]); 
  [lastUrl, lastUrlStartTime] = [lastUrl.lastUrl, lastUrlStartTime.lastUrlStartTime];
  let currentTab = await getActiveTab();
  if(currentTab.url != lastUrl) return 0;
  return Math.floor((+new Date()/1000) - lastUrlStartTime);
}

function genUrlDomainRegexp(url){
  return ".*?:\/\/"+escapeRegExp(url.match(/.*?:\/\/(.*?)\/.*/)[1])+"\/.*";
}

async function spentTime(checkInterval, urlRegexp){
  let currentTab = await getActiveTab();
  let currentTimestamp = +new Date()/1000;
  let time = 0;
  let regexp = new RegExp(urlRegexp);
  if(regexp.test(currentTab.url)) time += await timeOnActiveTab();

  let db = await getDb();
  let currentEl = db.length-1;
  // [url, startTimestamp, timeInterval]
  while(currentEl >= 0 && ((db[currentEl][1] + db[currentEl][2]) > (currentTimestamp - checkInterval))){
    if(regexp.test(db[currentEl][0])){
      time += db[currentEl][2];
    }
    currentEl--;
  }
  return time;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

(async function(){
  setInterval(async () => {
    console.log("Time on active tab:", await timeOnActiveTab());
    console.log("Time on stackoverflow in past 10 minutes:", await spentTime(10*60, ".*?://stackoverflow\.com/.*"));
    console.log("Time on active page in past 10 minutes:", await spentTime(10*60, genUrlDomainRegexp((await getActiveTab()).url)));
  }, 5000);
})();

