(async function() {
    browser.runtime.onMessage.addListener((message) => {
        if (message.command === "") {
            writeStats(message.num);
        }
    });

    let req = browser.runtime.sendMessage({
        message: 'timeAnalisis',
    });
    writeStats(await req);

    function writeStats(stats){
        // let div = document.getElementById('statistics');
        // div.append();
        console.log(stats);
    }
})();