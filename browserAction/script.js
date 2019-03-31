/* Pop-up Menu */
var listInput = document.querySelector('.domain-list input');
var whichList = document.querySelector('.domain-list select');
var addBtn = document.querySelector('.add-to-list');
var statBtn = document.querySelector('.statistics');

/* Listeners */
addBtn.addEventListener('click', addToList);
statBtn.addEventListener('click', showStats);

async function getDb(db){
let t;
try {
    t = JSON.parse((await browser.storage.local.get(db))[db]);
} catch(e) {
    t = [];
}
return t;
}

function setDb(array, db){
browser.storage.local.set({[db]: JSON.stringify(array)});
}

async function addToDb(obj, db){
let entries = await getDb(db);
entries.push(obj);
setDb(entries, db);
}

async function addToList() {
    let domain = listInput.value;
    if(listInput.value == 'whitelist'){
        addToDb(domain, 'whitelist');
    } else {
        addToDb(domain, 'blacklist');
    }
}

function showStats() {
    browser.storage.local.get().then(result => console.log(result));
    console.log('asdasd');
    browser.runtime.sendMessage( {
        command: "popup",
    });
}