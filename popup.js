//Some vars
var url;
var res;
localStorage.notif = 0;
chrome.browserAction.setBadgeText({text: ""});

//connection websocket
var socket = io.connect('http://protected-bastion-9703.herokuapp.com');
chrome.extension.sendMessage({cmd : "refresh"});
socket.emit("list_group");


var date_updater;
function start_date_updater() {
	console.log("starting date-updater");
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
				if( days > 0) {	output = days + " jours"}else if( hours > 0) { output = hours + " heures"}else if( minutes > 0) { output = minutes + " minutes"}else if( seconds > 0) { output = seconds + " secondes"};
				$("a .date",this).html(' il y a ' + output);
			}
		})
	}, 1000);
}

function stop_date_updater(){
	console.log('stop');
	clearInterval(date_updater);
}


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
			if(tab[0].url.match(/http|https/gi) != null){
				socket.emit('url', { url: tab[0].url, name: tab[0].title, user : localStorage.user, comment: $("#comment").val() });
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
			socket.emit('like', { id: $(this).parents("li").data("id"), user: localStorage.user });
			$(this).next().html(Number($(this).next().html()) +1 );
			$(this).addClass("liked").attr('disabled', 'disabled');
			$(this).die("click");
		}
	});
	
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
	
	//Login
	$("#login_button").click(function(event){
		event.preventDefault();
		localStorage.user = $("#login input").val();
		chrome.extension.sendMessage({cmd : "refresh"});
		$("#login").hide();
		$("#post").show();
		$("#liens").show();
	});
});