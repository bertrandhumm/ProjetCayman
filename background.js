// Notifications
localStorage.notif = 0;
var socket;
// Menu Contextuel
chrome.contextMenus.onClicked.addListener(function(info, tab){
	console.log(tab.url);
	console.log(tab.title);
})
//chrome.contextMenus.create({title:'Partlink'});

//Restaure la connection précédente
if(localStorage.url){
	console.log("Restauration de la connection sur :"+ localStorage.url);
	socket = io.connect(localStorage.url);
	socket.on('connect',function(){
  		console.log('joined namespace ' + message.room);
  	})
}

// Pour forcer le rafraichissement
chrome.extension.onMessage.addListener(
	function(message, sender, sendResponse) {
	if ( message.room && !socket ) {
		// Badge rouge en cas de reception de nouveaux messages + Envoi des liens a popup.js
		localStorage.url = 'http://protected-bastion-9703.herokuapp.com/' + message.room;
		socket = io.connect(localStorage.url);
		socket.on('connect',function(){
  						console.log('joined namespace ' + message.room);
  		})
		// Reception de liens
		socket.on('links', function(data){
			localStorage.notif++; console.log("RECEPTION");
			chrome.browserAction.setBadgeText({text: localStorage.notif});
			chrome.browserAction.setBadgeBackgroundColor({color: "#FF0000"});
			chrome.extension.sendMessage({cmd : "links", links : data});
		});
		// Reception de likes
		socket.on('updated_likes', function(data){
			console.log(data);
			chrome.extension.sendMessage({cmd : "likes", likes : data});
		});

	}
	if ( message.cmd == "refresh" && socket ) {
		console.log("ENVOI");
		socket.emit("list");
	}
	if ( message.cmd == "send_url" && socket ) {
			console.log("emit URL");
			socket.emit('url', { url: message.url, name: message.title, user : localStorage.user, comment: message.comment });
	}
	if ( message.cmd == "send_like" && socket ) {
		console.log("send_like");
		socket.emit('like', { id : message.id, user: message.user});
	}
	if ( message.cmd == "send_view" && socket ) {
		socket.emit('view', {id : message.id});
	}
	
});