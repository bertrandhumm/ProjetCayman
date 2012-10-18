//Some vars
var url;
var res;
localStorage.notif = 0;

//connection websocket
var socket = io.connect('http://protected-bastion-9703.herokuapp.com');
socket.emit('list');
socket.emit("list_group");

/*
 *	Login
 *
 */
 
//Liste des groupes
socket.on('list_group_receive', function(data){
	$('#login form select').html("");
	$('#login form select').append("<option>" + data[0].group + "</option>");
	for (var i = 0; i < data.length - 1; i++) {
    	if (data[i + 1].group != data[i].group) {
        	$('#login form select').append("<option>" + data[i].group + "</option>");
    	}
	}
});

/*
 *	Liens
 *
 */
chrome.extension.onMessage.addListener(
	function(message, sender, sendResponse) {
	if ( message.cmd == "links") {
		data = message.links;
		chrome.browserAction.setBadgeText({text: "<-"});
		$("#liens>ul").html("");
		$(data).each(function(index, element){
			$("#liens>ul").append("<a href='" + element.url.url + "' target='_blank' title='" + element.url.url + "'><li><h2>" + element.url.name + "</h2><span>"+ element.url.comment +"</span><em>" + element.user + "</em></li></a><img src='images/border_bottom.png'>");
			localStorage.liens = $("#liens>ul").html();
			chrome.browserAction.setBadgeText({text: " "});
			chrome.browserAction.setBadgeBackgroundColor({color: "#7DBC29"});
		})
	}
});

/*
 *	Action sur le document nécessitant jQuery
 *
 */
$(document).ready(function(){
	// Désactivation Submit
	$('#comment').keyup(check_textarea);
	//Definition d'un utilisateur
	if(!localStorage.user){
		$("#liens").hide();
		$("#post").hide();
		$("#login").show();
	}

	//Restaure la liste des liens s'ils sont stockés avec localStorage
	if(localStorage.liens){
		$("#liens>ul").html(localStorage.liens);
	}
	
	//Envoi de post
	$("#send_post").click(function(){
		chrome.browserAction.setBadgeText({text: "!"});
		chrome.browserAction.setBadgeBackgroundColor({color: "#FFD700"});
		chrome.tabs.query({active:true},function(tab){
			// On vérifie le protocole de la page (Interdication de "chrome", "file" et filtrage de "https")
			console.log(tab[0].url.substring(0,tab[0].url.search(":")));
    		socket.emit('url', { url: tab[0].url, name: tab[0].title, tab: tab[0], user : localStorage.user, comment: $("#comment").val() });
			$('#comment').val('');
			$('#send_post').addClass("disabled").attr('disabled', 'disabled');
		});
		
	});
	
	
	function check_textarea(){
		var textarea = $('#comment').val();
		if(textarea != '' && textarea.length < 120){
			$('#send_post').removeClass("disabled").removeAttr('disabled');
		}
		else {
			$('#send_post').addClass("disabled").attr('disabled', 'disabled');
		}
	}
	
	//Login
	$("#login_button").click(function(event){
		event.preventDefault();
		localStorage.user = $("#login input").val();
		chrome.extension.sendMessage({cmd : "refresh"});
		$("#login").hide();
		$("#post").show();
		$("#liens").show();
	})
	
});