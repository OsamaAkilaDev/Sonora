// Uploads in the harness never finish: the chip holds at the progress the shot asks for.
export { checkFile, formatBytes } from "../../../apps/web/src/features/chats/upload";

export function uploadFile(_chatId: string, _file: File, onProgress: (p: number) => void) {
  onProgress((globalThis as { __uploadProgress?: number }).__uploadProgress ?? 0.6);
  return new Promise<never>(() => {});
}
