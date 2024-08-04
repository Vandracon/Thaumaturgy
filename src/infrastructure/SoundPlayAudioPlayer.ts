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
}
