import { ISystem } from "../Interfaces/ISystem";

export class SystemService {
  constructor(private system: ISystem) {}

  async restartMemGPT(): Promise<void> {
    return this.system.restartMemGPT();
  }
}
