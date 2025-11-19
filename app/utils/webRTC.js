let localStream;
let peerConnection;

const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export async function startLocalStream(videoRef) {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });

  videoRef.current.srcObject = localStream;
}

export function createPeerConnection(remoteVideoRef, onIceCandidate) {
  peerConnection = new RTCPeerConnection(config);

  // Add local tracks to peer connection
  if (localStream) {
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });
  }

  // Handle remote stream
  peerConnection.ontrack = (event) => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = event.streams[0];
    }
  };

  // ICE candidate event
  peerConnection.onicecandidate = (event) => {
    if (event.candidate && onIceCandidate) {
      onIceCandidate(event.candidate);
    }
  };

  return peerConnection;
}

export function closePeerConnection() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }
}
