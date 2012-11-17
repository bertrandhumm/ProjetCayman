// Notifications
localStorage.notif = 0;
var socket = {};
// Menu Contextuel
chrome.contextMenus.onClicked.addListener(function(info, tab){
	console.log(tab.url);
	console.log(tab.title);
})
//chrome.contextMenus.create({title:'Partlink'});

//Restaure la connection précédente
if(localStorage.urls){
	var urls = JSON.parse(localStorage.urls);
	urls.forEach(function(room, index){
		console.log("Restauration de la connection sur :"+ room);
		socket[room] = io.connect('http://protected-bastion-9703.herokuapp.com/' + room);
		socket[room].on('connect',function(){
  			console.log('joined namespace ' + room);
	  	})
  	})
}else{
	localStorage.urls = "[]";
}

// Pour forcer le rafraichissement
chrome.extension.onMessage.addListener(
	function(message, sender, sendResponse) {
	if ( message.room && socket != {} ) {
		message.room.forEach(function(room, index){
			// Badge rouge en cas de reception de nouveaux messages + Envoi des liens a popup.js
			var prev_urls = JSON.parse(localStorage.urls);
			prev_urls.push(room.namespace);
			localStorage.urls = JSON.stringify(prev_urls);
			socket[room.namespace] = io.connect( 'http://protected-bastion-9703.herokuapp.com/' + room.namespace ); console.log(socket);
			socket[room.namespace].on('connect',function(){
							console.log('joined namespace ' + room.namespace);
			})
			// Reception de liens
			socket[room.namespace].on('links', function(data){
				localStorage.notif++; 
				console.log("RECEPTION ");
				chrome.browserAction.setBadgeText({text: localStorage.notif});
				chrome.browserAction.setBadgeBackgroundColor({color: "#FF0000"});
				chrome.extension.sendMessage({cmd : "links", links : data, tab: this.name.substring(1) });
			});
			// Reception de likes
			socket[room.namespace].on('updated_likes', function(data){
				console.log(data);
				chrome.extension.sendMessage({cmd : "likes", likes : data, tab: this.name.substring(1)});
			});
		});
	}
	if ( message.cmd == "refresh" && socket.length != {}  ) {
		console.log("ENVOI");
		for(var room in socket ){
			socket[room].emit("list");
		};
	}
	if ( message.cmd == "send_url" && socket != {} ) {
			console.log("emit URL" + message.title);
			console.log(message.namespace);
			socket[message.namespace].emit('url', { url: message.url, name: message.title, user : localStorage.user, comment: message.comment });
	}
	if ( message.cmd == "send_like" && socket != {}) {
		console.log("send_like");
		socket["508d76353438bc0008000002"].emit('like', { id : message.id, user: message.user});
	}
	if ( message.cmd == "send_view" && socket != {}) {
		socket["508d76353438bc0008000002"].emit('view', {id : message.id});
	}
	
});
