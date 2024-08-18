let videos = [];
let recentVideos = [];
let recentVideosLimit;
let player;
let apiReady = false;
let videosFetched = false;

function onYouTubeIframeAPIReady() {
	apiReady = true;
	checkAndLoadVideos();
}

function fetchVideos() {
	fetch('videos.yml')
		.then(response => response.text())
		.then(data => {
			const parsedData = jsyaml.load(data);
			const path = window.location.pathname.split('/').filter(Boolean);
			const listName = path.length > 1 ? path[1] : parsedData.default;
			videos = parsedData[listName] || parsedData[parsedData.default];
			console.info('Videos:', videos);
			recentVideosLimit = videos.length - 2;
			console.info(`Will not repeat the ${recentVideosLimit} most recent videos`);
			videosFetched = true;
			checkAndLoadVideos();
		})
		.catch(error => console.error('Error fetching videos:', error));
}

function checkAndLoadVideos() {
	if (apiReady && videosFetched) {
		loadNextVideo();
	}
}

function getRandomVideo() {
	let availableVideos = videos.filter(video => !recentVideos.includes(video.id));
	if (availableVideos.length === 0) {
		recentVideos = [];
		availableVideos = [...videos];
	}
	const randomIndex = Math.floor(Math.random() * availableVideos.length);
	const selectedVideo = availableVideos[randomIndex];
	recentVideos.push(selectedVideo.id);
	if (recentVideos.length > recentVideosLimit) {
		recentVideos.shift();
	}
	return selectedVideo;
}

function loadNextVideo() {
	const nextVideo = getRandomVideo();
	console.info(`Playing "${nextVideo.name}" by ${nextVideo.artist}`);
	if (player) {
		player.loadVideoById(nextVideo.id);
	} else {
		player = new YT.Player('player', {
			height: '100%',
			width: '100%',
			videoId: nextVideo.id,
			playerVars: {
				'autoplay': 1,
				'controls': 1,
				'showinfo': 0,
				'autohide': 1,
				'loop': 0 // Set loop to 0 to handle end event
			},
			events: {
				'onStateChange': onPlayerStateChange
			}
		});
	}
}

function onPlayerStateChange(event) {
	const stateMap = {
		'-1': 'unstarted',
		'0': 'ended',
		'1': 'playing',
		'2': 'paused',
		'3': 'buffering',
		'5': 'video cued'
	};
	const state = stateMap[event.data] || 'unknown';
	console.log(`Player state change: ${state}`);
	if (event.data === YT.PlayerState.ENDED) {
		console.log('Loading new video');
		loadNextVideo();
	}
}

// Load the IFrame Player API code asynchronously.
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// Fetch videos
fetchVideos();