import { ISystem } from "../Core/Interfaces/ISystem";
import Docker from "dockerode";
import config from "config";

export class DockerSystem implements ISystem {
  private docker: Docker;
  private memGPTContainerName: string;

  constructor() {
    this.docker = new Docker();
    this.memGPTContainerName = config.SYSTEM.MEMGPT_CONTAINER_NAME;
  }

  async restartMemGPT(): Promise<void> {
    try {
      const container = this.docker.getContainer(this.memGPTContainerName);
      await container.restart();

      console.log(
        `Container ${this.memGPTContainerName} restarted successfully`,
      );

      // Wait for the container to be fully up and healthy
      await this.waitForContainerHealth(this.memGPTContainerName);
    } catch (error: any) {
      const errMsg = `Error restarting container ${this.memGPTContainerName}: ${error.message || error}`;
      console.error(errMsg);
      throw new Error(errMsg);
    }
  }

  private async waitForContainerHealth(
    containerId: string,
    timeoutMs = 90000,
  ): Promise<void> {
    const startTime = Date.now();
    const timeout = startTime + timeoutMs;
    while (Date.now() < timeout) {
      try {
        const container = this.docker.getContainer(containerId);
        const containerInfo = await container.inspect();
        const healthStatus = containerInfo.State.Health?.Status || "unknown";

        // Check if the container is healthy
        if (healthStatus === "healthy") {
          console.log(`Container ${containerId} is healthy.`);
          return;
        }

        // Optionally, if there's no Health status, just check if the container is running
        if (containerInfo.State.Status === "running") {
          console.log(`Container ${containerId} is running.`);
          return;
        }
      } catch (error: any) {
        console.error(`Error checking container health: ${error.message}`);
      }

      // Wait for a bit before checking again
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    throw new Error(`Container ${containerId} did not become healthy in time.`);
  }
}
