document.addEventListener("DOMContentLoaded", () => {
  // Initialize the audio player and variables
  let currentSong = new Audio();
  let songs = [];
  let currentlyPlayingIndex = null;

  // Converts seconds to a MM:SS format
  function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
      return "00:00";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  }

  // Fetch songs from the "Liked Songs" folder
  async function loadSongs() {
    try {
      const response = await fetch('/api/songs');
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      songs = data.songs;
      displaySongs();
    } catch (error) {
      console.error("Error loading songs:", error);
      songs = [];
      displaySongs();
    }
  }

  // Plays the song at the specified index, or pauses it if it's already playing
  function playMusic(index) {
    if (index < 0 || index >= songs.length) return;

    if (currentlyPlayingIndex === index) {
      if (currentSong.paused) {
        currentSong.play();
        document.querySelector("#play").src = "img/pause.svg";
        document.querySelector(
          `.songList ul li:nth-child(${index + 1}) .playnow img`
        ).src = "img/pause.svg";
      } else {
        currentSong.pause();
        document.querySelector("#play").src = "img/play.svg";
        document.querySelector(
          `.songList ul li:nth-child(${index + 1}) .playnow img`
        ).src = "img/play.svg";
      }
      return;
    }

    currentlyPlayingIndex = index;
    const songName = songs[index];
    currentSong.src = `/Liked Songs/${encodeURIComponent(songName)}`;
    currentSong.play();
    document.querySelector("#play").src = "img/pause.svg";
    document.querySelector(".songinfo").innerHTML = decodeURIComponent(
      songName.replace(/\.[^/.]+$/, "") // Remove file extension
    );
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";

    displaySongs();
  }

  // Displays the list of songs
  function displaySongs() {
    let songUL = document.querySelector(".songList ul");
    
    if (songs.length === 0) {
      songUL.innerHTML = '<li style="padding: 20px; text-align: center; color: grey;">No songs found. Add songs to the "Liked Songs" folder and refresh the page.</li>';
      return;
    }

    songUL.innerHTML = songs
      .map(
        (song, index) => {
          const songName = song.replace(/\.[^/.]+$/, ""); // Remove file extension
          return `
      <li>
        <img class="invert" width="34" src="img/music.svg" alt="music">
        <div class="info">
          <div>${decodeURIComponent(songName.replaceAll("%20", " "))}</div>
        </div>
        <div class="playnow">
          <span>Play Now</span>
          <img class="invert" src="${
            currentlyPlayingIndex === index ? "img/pause.svg" : "img/play.svg"
          }" alt="play">
        </div>
      </li>`;
        }
      )
      .join("");

    Array.from(songUL.getElementsByTagName("li")).forEach((li, index) => {
      li.addEventListener("click", () => playMusic(index));
    });
  }

  // Sets up various event listeners for player controls
  function setupEventListeners() {
    document.querySelector("#play").addEventListener("click", () => {
      if (songs.length === 0) return;
      
      if (currentSong.paused) {
        if (currentlyPlayingIndex === null) {
          playMusic(0);
        } else {
          currentSong.play();
          document.querySelector("#play").src = "img/pause.svg";
          if (currentlyPlayingIndex !== null) {
            document.querySelector(
              `.songList ul li:nth-child(${
                currentlyPlayingIndex + 1
              }) .playnow img`
            ).src = "img/pause.svg";
          }
        }
      } else {
        currentSong.pause();
        document.querySelector("#play").src = "img/play.svg";
        if (currentlyPlayingIndex !== null) {
          document.querySelector(
            `.songList ul li:nth-child(${
              currentlyPlayingIndex + 1
            }) .playnow img`
          ).src = "img/play.svg";
        }
      }
    });

    // Update the song's progress and time display
    currentSong.addEventListener("timeupdate", () => {
      document.querySelector(
        ".songtime"
      ).innerHTML = `${secondsToMinutesSeconds(
        currentSong.currentTime
      )} / ${secondsToMinutesSeconds(currentSong.duration)}`;
      document.querySelector(".circle").style.left = `${
        (currentSong.currentTime / currentSong.duration) * 100
      }%`;
    });

    // Auto-play next song when current song ends
    currentSong.addEventListener("ended", () => {
      if (currentlyPlayingIndex !== null && currentlyPlayingIndex < songs.length - 1) {
        playMusic(currentlyPlayingIndex + 1);
      } else {
        // If it's the last song, reset the player
        currentlyPlayingIndex = null;
        document.querySelector("#play").src = "img/play.svg";
        document.querySelector(".songinfo").innerHTML = "";
        document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
        document.querySelector(".circle").style.left = "0%";
        displaySongs(); // Update the UI to show all songs as not playing
      }
    });

    // Seek within the song
    document.querySelector(".seekbar").addEventListener("click", (e) => {
      let percent = e.offsetX / e.target.getBoundingClientRect().width;
      currentSong.currentTime = percent * currentSong.duration;
    });

    // Toggle the sidebar menu
    document.querySelector(".hamburger").addEventListener("click", () => {
      document.querySelector(".left").style.left = "0";
    });

    // Close the sidebar menu
    document.querySelector(".close").addEventListener("click", () => {
      document.querySelector(".left").style.left = "-120%";
    });

    // Play the previous song
    document.querySelector("#previous").addEventListener("click", () => {
      if (currentlyPlayingIndex > 0) {
        playMusic(currentlyPlayingIndex - 1);
      }
    });

    // Play the next song
    document.querySelector("#next").addEventListener("click", () => {
      if (currentlyPlayingIndex < songs.length - 1) {
        playMusic(currentlyPlayingIndex + 1);
      }
    });

    // Adjust the volume
    document.querySelector(".range input").addEventListener("input", (e) => {
      currentSong.volume = e.target.value / 100;
      document.querySelector(".volume img").src =
        e.target.value > 0 ? "img/volume.svg" : "img/mute.svg";
    });

    // Mute or unmute the audio
    document.querySelector(".volume img").addEventListener("click", () => {
      let volumeIcon = document.querySelector(".volume img");
      if (currentSong.volume > 0) {
        currentSong.volume = 0;
        volumeIcon.src = "img/mute.svg";
        document.querySelector(".range input").value = 0;
      } else {
        currentSong.volume = 0.1;
        volumeIcon.src = "img/volume.svg";
        document.querySelector(".range input").value = 10;
      }
    });

    // Auto-refresh song list every 5 seconds to detect new songs
    setInterval(() => {
      loadSongs();
    }, 5000);
  }

  // Main function to initialize the player
  async function main() {
    await loadSongs();
    setupEventListeners();
  }

  main();
});
