//Notifications
localStorage.notif = 0;

// Menu Contextuel
chrome.contextMenus.onClicked.addListener(function(info, tab){
	console.log(tab.url);
	console.log(tab.title);
})
chrome.contextMenus.create({title:'Partlink'});

// Badge rouge en cas de reception de nouveaux messages + Envoi des liens a popup.js
var socket = io.connect('http://protected-bastion-9703.herokuapp.com');

socket.on('links', function(data){
	localStorage.notif++;
	chrome.browserAction.setBadgeText({text: localStorage.notif});
	chrome.browserAction.setBadgeBackgroundColor({color: "#FF0000"});
	chrome.extension.sendMessage({cmd : "links", links : data});
})

//Pastille verte par defaut
chrome.browserAction.setBadgeText({text: " "});
chrome.browserAction.setBadgeBackgroundColor({color: "#7FFF00"});

//Pour forcer le rafraichissement
chrome.extension.onMessage.addListener(
	function(message, sender, sendResponse) {
	if ( message.cmd == "refresh") {
		socket.emit("list");
	}
});