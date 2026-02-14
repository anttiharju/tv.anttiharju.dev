let videos = [];
let recentVideos = [];
let recentVideosLimit;
let player;

function onYouTubeIframeAPIReady() {
  fetch('playlists.yml')
    .then(response => response.text())
    .then(data => {
      const parsedData = jsyaml.load(data);
      const path = window.location.pathname.split('/').filter(Boolean);
      console.debug('path:', path);
      const listName = path.length > 0 ? path[0] : parsedData.default;
      console.info('Playlist:', listName);
      videos = parsedData[listName] || parsedData[parsedData.default];
      console.info('Videos:', videos);
      recentVideosLimit = Math.floor(videos.length / 2);
      console.info(`Will not repeat the ${recentVideosLimit} most recent videos`);
      showThumbnails();
    })
    .catch(error => console.error('Error fetching videos:', error));
}

function showThumbnails() {
  const grid = document.getElementById('thumbnail-grid');
  grid.innerHTML = '';

  // Calculate how many thumbnails fit on screen
  const thumbnailWidth = 320; // minmax size from CSS
  const thumbnailHeight = 180; // YouTube thumbnail aspect ratio
  const cols = Math.floor(window.innerWidth / thumbnailWidth);
  const rows = Math.ceil(window.innerHeight / thumbnailHeight);
  const needed = cols * rows;

  // Show each video at least once, repeat only if necessary
  const displayVideos = [];
  if (videos.length >= needed) {
    displayVideos.push(...videos.slice(0, needed));
  } else {
    const repeats = Math.ceil(needed / videos.length);
    for (let i = 0; i < repeats; i++) {
      displayVideos.push(...videos);
    }
    displayVideos.splice(needed);
  }

  displayVideos.forEach(video => {
    const item = document.createElement('div');
    item.className = 'thumbnail-item';

    const img = document.createElement('img');
    img.src = `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`;
    img.alt = video.song && video.artist ? `${video.song} by ${video.artist}` : 'Video thumbnail';

    item.appendChild(img);
    item.addEventListener('click', () => startPlayback(video.id));

    grid.appendChild(item);
  });
}

function startPlayback(videoId) {
  document.getElementById('thumbnail-grid').style.display = 'none';
  document.querySelector('.video-container').style.display = 'block';

  if (player) {
    player.loadVideoById(videoId);
  } else {
    player = new YT.Player('player', {
      height: '100%',
      width: '100%',
      videoId: videoId,
      playerVars: {
        'autoplay': 1,
        'controls': 1,
        'showinfo': 0,
        'autohide': 1,
        'loop': 0
      },
      events: {
        'onStateChange': onPlayerStateChange
      }
    });
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

  videos.forEach(video => {
    if (video.song === selectedVideo.song || video.artist === selectedVideo.artist) {
      if (!recentVideos.includes(video.id)) {
        recentVideos.push(video.id);
      }
    }
  });

  if (recentVideos.length > recentVideosLimit) {
    recentVideos = recentVideos.slice(-recentVideosLimit);
  }
  return selectedVideo;
}

function loadNextVideo() {
  const nextVideo = getRandomVideo();
  console.info(`Playing "${nextVideo.song}" by ${nextVideo.artist}`);
  player.loadVideoById(nextVideo.id);
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
