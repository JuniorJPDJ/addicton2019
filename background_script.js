// Put all the javascript code here, that you want to execute in background.
console.log('ASDF5555555');
(function() {
console.log('ASDF!!!!!');

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