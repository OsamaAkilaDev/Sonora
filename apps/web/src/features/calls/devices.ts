import { create } from "zustand";
import { persist } from "zustand/middleware";

type DevicePrefs = {
  /** Empty string: the system default. */
  mic: string;
  camera: string;
  speaker: string;
  noiseSuppression: boolean;
  echoCancellation: boolean;
  autoGain: boolean;
};

/** Per device, so it lives in localStorage rather than the account. */
export const useDevicePrefs = create<DevicePrefs>()(
  persist(
    (): DevicePrefs => ({
      mic: "",
      camera: "",
      speaker: "",
      noiseSuppression: true,
      echoCancellation: true,
      autoGain: true,
    }),
    { name: "sonora-devices" },
  ),
);

export async function openMic(deviceId = useDevicePrefs.getState().mic) {
  const p = useDevicePrefs.getState();
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: deviceId ? { ideal: deviceId } : undefined,
      noiseSuppression: p.noiseSuppression,
      echoCancellation: p.echoCancellation,
      autoGainControl: p.autoGain,
    },
  });
  return stream.getAudioTracks()[0] as MediaStreamTrack;
}

export async function openCamera() {
  const { camera } = useDevicePrefs.getState();
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      deviceId: camera ? { ideal: camera } : undefined,
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
    },
  });
  return stream.getVideoTracks()[0] as MediaStreamTrack;
}

/** Why a device couldn't be opened, in words the person can act on. */
export function deviceError(e: unknown, device: "microphone" | "camera") {
  const name = e instanceof DOMException ? e.name : "";
  if (name === "NotAllowedError")
    return `Allow ${device} access in your browser's site settings, then try again.`;
  if (name === "NotFoundError") return `No ${device} found on this device.`;
  if (name === "NotReadableError") return `Another app may be using your ${device}.`;
  return `Couldn't start your ${device}.`;
}

export const canShareScreen = () => !!navigator.mediaDevices?.getDisplayMedia;
