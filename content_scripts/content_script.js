// Put all the javascript code here, that you want to execute after page load.
(function() {
console.log('content script!!!');

const texts = [
"czy na pewno nie masz czegoś do zrobienia?",
"a co powiedziałbyś na książkę?",
"czas się z kimś spotkać :)"
];

const images = [
"static/homework.jpg",
"static/book.jpg",
"static/outdoor.jpg"
];

function insertPopup(num) {
    console.log('insert!!!');
    let popupContainer = document.createElement("div");
    popupContainer.setAttribute('id', 'persistence-popup');
    popupContainer.style.position = 'fixed';
    popupContainer.style.zIndex = '99999';
    popupContainer.style.width = '500px';
    popupContainer.style.height = '280px';
    popupContainer.style.padding = '10px';
    popupContainer.style.textAlign = 'center';
    popupContainer.style.border = '1px solid';
    popupContainer.style.left = 'calc(50% - 250px)';
    popupContainer.style.top = '50px';
    popupContainer.style.backgroundColor = 'white';
    popupContainer.append(texts[num]);
    popupImage = document.createElement("img");
    popupImage.setAttribute('src', browser.extension.getURL(images[num]));
    popupImage.style.width = '320px';
    popupImage.style.height = '240px';
    popupContainer.appendChild(popupImage);
    document.body.appendChild(popupContainer);
}

function removePopup() {
    let popupContainer = document.getElementById('persistence-popup');
    popupContainer.remove();
}

browser.runtime.onMessage.addListener((message) => {
    if (message.command === "popup") {
        console.log('message: popup!!');
        insertPopup(message.num);
    } else if (message.command === "hide-popup") {
        console.log('message: hide-popup');
        removePopup();
    }
});

})();