import { IAudioPlayer } from "../Core/Interfaces/IAudioPlayer";

export class Bootstraper {
  private static audioPlayer: IAudioPlayer;

  static init(audioPlayer: IAudioPlayer) {
    Bootstraper.audioPlayer = audioPlayer;
  }

  static getAudioPlayer(): IAudioPlayer {
    return Bootstraper.audioPlayer;
  }
}
