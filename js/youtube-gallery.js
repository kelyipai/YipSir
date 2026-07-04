/* =============================================
   youtube-gallery.js — YouTube 影片區
   5 條影片 + IFrame API 播放器 + 縮圖格
   ============================================= */
(function () {
  'use strict';

  var CONFIG = {
    channelUrl: 'https://youtube.com/@wifiband6071',
    channelName: 'WiFi Band Yip Sir葉Sir',
    videos: [
      { id: 'd6IT3YEqvyg', title: 'Reflection of My Life', note: '黃良昇大師電子琴伴奏' },
      { id: 'cjpc6ioswTg', title: 'Scarborough Fair',      note: '黃良昇大師伴奏' },
      { id: 'wIVsC4MOc2w', title: 'More Than I Can Say',   note: '葉Sir在深圳' },
      { id: 'OPZSjMpdyKM', title: 'Smoke on the Water',    note: '黃良昇大師合奏' },
      { id: 'ZwVLPchCaIQ', title: '你到底愛誰',             note: '葉Sir 演唱' }
    ]
  };

  var player = null;
  var apiReady = false;
  var pendingId = null;
  var currentIdx = 0;

  /* --- Render Thumbnails --- */
  function renderThumbnails() {
    var container = document.getElementById('ytThumbs');
    if (!container) return;

    container.innerHTML = '';

    CONFIG.videos.forEach(function (video, idx) {
      var thumb = document.createElement('div');
      thumb.className = 'yt-thumb' + (idx === 0 ? ' active' : '');
      thumb.setAttribute('data-idx', idx);

      var img = document.createElement('img');
      img.src = 'https://img.youtube.com/vi/' + video.id + '/hqdefault.jpg';
      img.alt = video.title;
      img.loading = 'lazy';

      var playIcon = document.createElement('div');
      playIcon.className = 'yt-thumb-play';
      playIcon.textContent = '▶';

      var overlay = document.createElement('div');
      overlay.className = 'yt-thumb-overlay';

      var title = document.createElement('div');
      title.className = 'yt-thumb-title';
      title.textContent = video.title;

      var note = document.createElement('div');
      note.className = 'yt-thumb-note';
      note.textContent = video.note;

      overlay.appendChild(title);
      overlay.appendChild(note);
      thumb.appendChild(img);
      thumb.appendChild(playIcon);
      thumb.appendChild(overlay);

      thumb.addEventListener('click', function () {
        playVideo(idx);
      });

      container.appendChild(thumb);
    });
  }

  /* --- Play Video --- */
  function playVideo(idx) {
    currentIdx = idx;
    var video = CONFIG.videos[idx];
    if (!video) return;

    // Update active thumbnail
    var thumbs = document.querySelectorAll('.yt-thumb');
    thumbs.forEach(function (t, i) {
      t.classList.toggle('active', i === idx);
    });

    if (apiReady && player) {
      player.loadVideoById(video.id);
      // Scroll to player
      scrollToPlayer();
    } else {
      pendingId = video.id;
    }
  }

  function scrollToPlayer() {
    var wrap = document.querySelector('.yt-player-wrap');
    if (wrap) {
      wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /* --- Load YouTube IFrame API --- */
  function loadAPI() {
    if (document.getElementById('yt-iframe-api')) return;
    var tag = document.createElement('script');
    tag.id = 'yt-iframe-api';
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  }

  /* --- API Ready Callback (global) --- */
  window.onYouTubeIframeAPIReady = function () {
    apiReady = true;
    var firstVideo = CONFIG.videos[0];

    player = new YT.Player('ytPlayer', {
      videoId: firstVideo ? firstVideo.id : '',
      playerVars: {
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
        hl: 'zh_Hant'
      },
      events: {
        onReady: function () {
          // Hide placeholder
          var ph = document.getElementById('ytPlaceholder');
          if (ph) ph.classList.add('hidden');

          // Play pending video if any
          if (pendingId) {
            player.loadVideoById(pendingId);
            pendingId = null;
          }
        },
        onStateChange: function (event) {
          // Update active thumb when video changes
          if (event.data === YT.PlayerState.PLAYING) {
            var data = player.getVideoData();
            if (data && data.video_id) {
              CONFIG.videos.forEach(function (v, i) {
                if (v.id === data.video_id) currentIdx = i;
              });
              var thumbs = document.querySelectorAll('.yt-thumb');
              thumbs.forEach(function (t, i) {
                t.classList.toggle('active', i === currentIdx);
              });
            }
          }
        }
      }
    });
  };

  /* --- Init --- */
  function init() {
    // Set subscribe link
    var sub = document.getElementById('ytSubscribe');
    if (sub) sub.href = CONFIG.channelUrl;

    var ch = document.getElementById('ytChannel');
    if (ch) {
      ch.href = CONFIG.channelUrl;
      ch.textContent = CONFIG.channelName;
    }

    renderThumbnails();
    loadAPI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
