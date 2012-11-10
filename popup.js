$(document).ready(function(){
//Some vars
var url = 'http://protected-bastion-9703.herokuapp.com';
var res;
localStorage.notif = 0;
chrome.browserAction.setBadgeText({text: ""});


if( localStorage.token) {
	//Restaure la liste des liens s'ils sont stockés avec localStorage
	if(localStorage.liens){
		$("#liens>ul").html(localStorage.liens);
	}
	// Refresh
  	chrome.extension.sendMessage({cmd : "refresh"});
	$("#login").hide();
	$("#post").show();
	$("#liens").show();	
}else{
	/*
 	*	Login
 	*
 	*/
	var socket = io.connect(url);
	//Toolbox connexion
	// Liste les groupes
	socket.emit("list_group");
	// Reception
	socket.on('list_group_receive', function(data){
	$('#login form select').html("");
	for (var i = 0; i < data.length; i++) {
    	$('#login form select').append("<option>" + data[i].name + "</option>");
	}
	});
	// Misc Infos
	socket.on("socket_infos", function(data){
		console.log(data);
	});
	socket.on("token", function(data){
		localStorage.token = data;
		console.log("token: "+ data);
	});
	
	// Login
	$("#login_button").click(function(event){
		event.preventDefault();
		localStorage.user = $("#login #user").val();
		password = $("#login #password").val();
		console.log("Login : "+ localStorage.user + "Password : " + password);
		socket.emit("login", { user: localStorage.user, password: password }, function(response){
			console.log(response);
			if(response.error){
				$(".error").html(response.error);
				$("#login #user,#login #password").val("");
			}else{
				localStorage.token = response.ok;
				//Join a new domain
				socket.emit('route_me', {token :  localStorage.token}, function(data){
					var ns_socket = io.connect(url + '/' + data.namespace);
					// Une fois connecté a un groupe
					ns_socket.on('connect',function(){
  						console.log('joined namespace ' + data.namespace);
  						chrome.extension.sendMessage({room:  data.namespace});
  						chrome.extension.sendMessage({cmd : "refresh"});
						$("#login").hide();
						$("#post").show();
						$("#liens").show();
							
  				});
			});
			}
		});
	});
}

/*
 *	Temps des message en live
 *
 */

// Time pour la mise a jour des messages
var date_updater;
function start_date_updater() {
	date_updater = setInterval(function() {
		$("#liens ul li").each(function(index, element){
			post_time = $(this).data("timestamp");
			if( post_time != "undefined"){
				mnt = new Date();
				ms = (mnt.getTime()-Date.parse(post_time));
				x = ms / 1000;
				seconds = Math.floor(x % 60);
				x /= 60;
				minutes = Math.floor(x % 60);
				x /= 60;
				hours = Math.floor(x % 24);
				x /= 24,
				days = Math.floor(x);
				var output;
				if( days > 0) {	output = days + " jours"}
				else if( hours > 0) { output = hours + " heures"}
				else if( minutes > 0) { output = minutes + " minutes"}
				else if( seconds > 0) { output = seconds + " secondes"}
				else if( seconds < 0 ) { output = " moins d'une seconde"}
				if( typeof output != 'undefined') { 
					$("a .date",this).html(' il y  a ' + output);
				};
			}
		})
	}, 1000);
}

function stop_date_updater(){
	clearInterval(date_updater);
}

/*
 *	Listener Chrome pour les messages de Background.js
 *
 */
chrome.extension.onMessage.addListener(
	function(message, sender, sendResponse) {
	if ( message.cmd == "links") {
		data = message.links;
		chrome.browserAction.setBadgeText({text: "<-"});
		stop_date_updater();
		$("#liens>ul").html("");
		$(data).each(function(index, element){
			var disabled = "'";
			if( jQuery.inArray(localStorage.user, element.votes) != -1) { 
				disabled = " liked' disabled='disabled'";
			}
			$("#liens>ul").append("<li data-id='" + element._id + "' data-timestamp='"+ element.timestamp +"' ><div class='transition_all'><input type='image' id='like_button' src='images/empty.png' class='transition_opacity"+disabled+"' /><b class='transition_opacity'>" + element.votes.length + "</b></div><a href='" + element.url + "' target='_blank' title='" + element.title + "'><h2>" + element.title + "</h2><span>"+ element.comment +"</span><em>" + element.user + "</em><em class='date'></em></a></li><div class='clear'></div><img src='images/border_bottom.png'>");
			mnt = new Date();
			post = Date.parse(element.timestamp);
		
		})
		localStorage.liens = $("#liens>ul").html();
		localStorage.notif = 0;
		chrome.browserAction.setBadgeText({text: ""});
		start_date_updater();
	}
	if ( message.cmd == "likes") {
		data = message.likes;
		$("#liens ul li").each( function(index, element){
			if($(element).data('id') == data._id){
				$(".transition_all b", element).html(data.likes);
			}
		});
	}	
});


	// Désactivation Submit
	$('#comment').keyup(check_textarea);
		
	//Envoi de post
	$("#send_post").click(function(){
		chrome.browserAction.setBadgeText({text: "!"});
		chrome.browserAction.setBadgeBackgroundColor({color: "#FFD700"});
		chrome.tabs.query({active:true},function(tab){
			if(tab[0].url.match(/http|https/gi) != null){
				chrome.extension.sendMessage({cmd: "send_url", url : tab[0].url , title : tab[0].title, comment : $("#comment").val() });
				$('#comment').val('');
				$('#send_post').addClass("disabled").attr('disabled', 'disabled');
				chrome.browserAction.setBadgeText({text: ""});
			}
		});
		
	});
	
	//Bouton like
	$("#like_button").live("click", function(event){
		event.preventDefault();
			if( $(this).attr("disabled") != 'disabled') {
			chrome.extension.sendMessage( {cmd: "send_like", id : $(this).parents("li").data("id"), user : localStorage.user } );
			$(this).next().html(Number($(this).next().html()) +1 );
			$(this).addClass("liked").attr('disabled', 'disabled');
			$(this).die("click");
		}
	});
	
	// Vérifie la validité de l'URL a envoyer
	function check_textarea(){
		chrome.tabs.query({active:true},function(tab){
			var textarea = $('#comment').val();
			if(textarea != '' && textarea.length < 110 && tab[0].url.match(/http|https/gi) != null){
				$('#send_post').removeClass("disabled").removeAttr('disabled');
			} else {
				$('#send_post').addClass("disabled").attr('disabled', 'disabled');
			}
		});	
	}
	
	
	//Vues 
	$("a").live('click', function(event){
		event.preventDefault();
		chrome.extension.sendMessage( {cmd : "send_view", id : $(this).parents("li").data("id") });
		chrome.tabs.create({url: $(this).attr("href")});
	})
});