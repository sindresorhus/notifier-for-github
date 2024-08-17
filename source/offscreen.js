import browser from 'webextension-polyfill';

// Listen for messages from the extension
browser.runtime.onMessage.addListener(message => {
	if (message.action === 'play') {
		playAudio(message.options);
	}
});

// Play sound with access to DOM APIs
function playAudio({source, volume}) {
	const audio = new Audio(source);
	audio.volume = volume;
	audio.play();
}
