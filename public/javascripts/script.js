const map = L.map("map").setView([0, 0], 2);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {}).addTo(
  map
);

const socket = io();
socket.emit("join-room", "<%= roomId %>");

let myMarker = null;
let initialZoomDone = false;
function updateUserMarker(latitude, longitude) {
  if (myMarker) {
    myMarker.setLatLng([latitude, longitude]);
  } else {
    myMarker = L.marker([latitude, longitude]).addTo(map);
  }
}

function centerMapOnLocation(latitude, longitude) {
  map.setView([latitude, longitude], 16);
}

socket.on("location", (data) => {
  const { id, latitude, longitude } = data;

  if (id === socket.id && !initialZoomDone) {
    centerMapOnLocation(latitude, longitude);
    initialZoomDone = true;
  }

  if (id !== socket.id) {
    const marker = L.marker([latitude, longitude]).addTo(map);
    marker.id = id;
  }
});

socket.on("user-disconnected", (id) => {
  map.eachLayer((layer) => {
    if (layer instanceof L.Marker && layer.id === id) {
      map.removeLayer(layer);
    }
  });
});

setInterval(() => {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      socket.emit("send-location", {
        roomId: "<%= roomId %>",
        latitude,
        longitude,
      });
      updateUserMarker(latitude, longitude);
    },
    (error) => {
      console.error("Geolocation error:", error);
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    }
  );
}, 5000);
const button = document.createElement("button");
button.textContent = "Go to My Location";
button.style.position = "absolute";
button.style.top = "10px";
button.style.right = "10px";
button.style.zIndex = "1000";
document.body.appendChild(button);

button.addEventListener("click", () => {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      centerMapOnLocation(latitude, longitude);
    },
    (error) => {
      console.error("Geolocation error:", error);
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    }
  );
});
