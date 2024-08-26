export interface IAudioPlayer {
  playSound(filePath: string, volume: number): void;
  playErrorBeep(volume?: number): void;
  playLLMBeep(volume?: number): void;
  playNoNPCFoundBeep(volume?: number): void;
}
