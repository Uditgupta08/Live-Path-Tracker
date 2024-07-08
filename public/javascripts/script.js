const map = L.map("map").setView([0, 0], 2);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {}).addTo(
  map
);

const socket = io();
socket.emit("join-room", "<%= roomId %>");

let myMarker = null;
let isFirstUpdate = true; 
function updateUserMarker(latitude, longitude) {
  if (myMarker) {
    myMarker.setLatLng([latitude, longitude]);
  } else {
    myMarker = L.marker([latitude, longitude]).addTo(map);
  }
  if (isFirstUpdate) {
    map.setView([latitude, longitude], 16);
    isFirstUpdate = false;
  }
}

socket.on("location", (data) => {
  const { id, latitude, longitude } = data;

  if (id !== socket.id) {
    const existingMarker = map.eachLayer((layer) => {
      if (layer instanceof L.Marker && layer.id === id) {
        layer.setLatLng([latitude, longitude]);
        return layer;
      }
    });

    if (!existingMarker) {
      const marker = L.marker([latitude, longitude]).addTo(map);
      marker.id = id;
    }
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
