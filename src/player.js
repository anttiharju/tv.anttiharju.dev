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

  // Shuffle videos for randomization
  const shuffledVideos = [...videos].sort(() => Math.random() - 0.5);

  const aspectRatio = 16 / 9; // YouTube thumbnail aspect ratio
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  
  // Calculate optimal tile size to fit all videos
  const videoCount = videos.length;
  let cols = Math.ceil(Math.sqrt(videoCount * screenWidth / screenHeight * (1 / aspectRatio)));
  let thumbnailWidth = screenWidth / cols;
  let thumbnailHeight = thumbnailWidth / aspectRatio;
  let rows = Math.ceil(videoCount / cols);
  
  // Adjust if it doesn't fit vertically
  while (thumbnailHeight * rows > screenHeight && rows > 1) {
    cols++;
    thumbnailWidth = screenWidth / cols;
    thumbnailHeight = thumbnailWidth / aspectRatio;
    rows = Math.ceil(videoCount / cols);
  }
  
  // Update grid template
  grid.style.gridTemplateColumns = `repeat(${cols}, ${thumbnailWidth}px)`;
  
  // Calculate how many tiles fit on screen (including partial rows)
  const visibleRows = Math.ceil(screenHeight / thumbnailHeight);
  const needed = cols * visibleRows;
  
  // Fill the grid - show each video once, then repeat only to fill remaining visible space
  const displayVideos = [...shuffledVideos];
  
  if (displayVideos.length < needed) {
    const remaining = needed - displayVideos.length;
    const shuffledForRepeat = [...videos].sort(() => Math.random() - 0.5);
    displayVideos.push(...shuffledForRepeat.slice(0, remaining));
  }


  displayVideos.forEach(video => {
    const item = document.createElement('div');
    item.className = 'thumbnail-item';

    const img = document.createElement('img');
    img.src = `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`;
    img.alt = video.song && video.artist ? `${video.song} by ${video.artist}` : 'Video thumbnail';

    const overlay = document.createElement('div');
    overlay.className = 'thumbnail-overlay';

    const song = document.createElement('div');
    song.className = 'overlay-song';
    song.textContent = video.song || 'Unknown';

    const artist = document.createElement('div');
    artist.className = 'overlay-artist';
    artist.textContent = video.artist || 'Unknown Artist';

    overlay.appendChild(song);
    overlay.appendChild(artist);

    item.appendChild(img);
    item.appendChild(overlay);
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
