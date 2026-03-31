const allowBtn = document.querySelector("#allowCamera");
const connectBtn = document.querySelector("#connectCamerea");
const video = document.querySelector("video");

const CameraObserver = (() => {
  let stream = null;
  let permissionState = "unknown";

  const log = (msg) => {
    console.log(`[CameraObserver] ${msg}`);
  };

  // 🔒 Watch permission state
  const initPermissions = async () => {
    try {
      const status = await navigator.permissions.query({ name: "camera" });

      permissionState = status.state;
      log(`Permission: ${permissionState}`);

      status.onchange = () => {
        permissionState = status.state;
        log(`Permission changed → ${permissionState}`);
      };
    } catch (err) {
      log("Permissions API not supported");
    }
  };

  // 📷 Ask for permission (but don’t attach to video)
  const allow = async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      log("Camera permission granted");

      attachTrackListeners();
    } catch (err) {
      if (err.name === "NotAllowedError") {
        log("Permission denied");
      } else {
        log("Error requesting camera: " + err.name);
      }
    }
  };

  // 🔌 Connect stream to video
  const connect = () => {
    if (!stream) {
      log("No stream available. Click Allow first.");
      return;
    }

    video.srcObject = stream;
    video.play();

    log("Camera connected to video");
  };

  // 👀 Observe track lifecycle
  const attachTrackListeners = () => {
    if (!stream) return;

    const track = stream.getVideoTracks()[0];

    track.onended = () => {
      if (permissionState === "denied") {
        log("Camera stopped → permission revoked");
      } else {
        log("Camera stopped → device disconnected / stopped");
      }
    };

    track.onmute = () => {
      log("Track muted (camera temporarily unavailable)");
    };

    track.onunmute = () => {
      log("Track unmuted (camera resumed)");
    };
  };

  // 🧪 Optional: health check
  const checkHealth = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      log("Health check OK");
    } catch (err) {
      if (err.name === "NotAllowedError") {
        log("Health check → permission denied");
      } else {
        log("Health check → device issue");
      }
    }
  };

  return {
    initPermissions,
    allow,
    connect,
    checkHealth,
  };
})();


// 🚀 Init observer
CameraObserver.initPermissions();

// 🎛 Buttons
allowBtn.addEventListener("click", CameraObserver.allow);
connectBtn.addEventListener("click", CameraObserver.connect);