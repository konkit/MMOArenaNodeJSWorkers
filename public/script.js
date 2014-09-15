var sock = new SockJS('/chat');

function addMessage(msg, name) {
	$("#chatEntries").append('<div class="message"><p>' + name + ' : ' + msg + '</p></div>');
}
function sentMessage() {
	if ($('#messageInput').val() != "") 
	{
		sock.send($('#messageInput').val());
		addMessage($('#messageInput').val(), "Me", new Date().toISOString(), true);
		$('#messageInput').val('');
	}
}
sock.onmessage = function(e) {
        data = JSON.parse(e.data)
	addMessage(data.message, data.name);
};
$(function() {
        $("#submit").click(function() {sentMessage();});
});
