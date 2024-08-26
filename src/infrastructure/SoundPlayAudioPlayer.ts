import SoundPlay from "sound-play";
import os from "os";
import { IAudioPlayer } from "../Core/Interfaces/IAudioPlayer";

export class SoundPlayAudioPlayer implements IAudioPlayer {
  playSound(filePath: string, volume: number = 1) {
    if (os.platform() === "darwin" || os.platform() === "win32") {
      SoundPlay.play(filePath, volume);
    } else {
      console.warn("Can't play audio on this OS");
    }
  }

  playErrorBeep(volume: number = 0.05): void {
    this.playSound(`${process.cwd()}/data/sounds/beep-bad.wav`, volume);
  }

  playLLMBeep(volume: number = 0.05): void {
    this.playSound(`${process.cwd()}/data/sounds/beep-llm.wav`, volume);
  }

  playNoNPCFoundBeep(volume: number = 0.05): void {
    this.playSound(`${process.cwd()}/data/sounds/beep-notfound.wav`, volume);
  }
}
