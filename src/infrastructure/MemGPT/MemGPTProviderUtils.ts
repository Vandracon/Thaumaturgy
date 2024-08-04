interface SystemAlertTrackerToAgent {
  sendsSinceLast: number;
  canSend: boolean;
}

interface ISystemAlertTrackerToAgent {
  [key: string]: SystemAlertTrackerToAgent;
}

export class MemGPTProviderUtils {
  private systemAlertTracker: ISystemAlertTrackerToAgent;

  constructor() {
    this.systemAlertTracker = {};
  }

  canSendSystemAlerts(agentId: string): boolean {
    this.ensureAlertTrackingEntityExists(agentId);
    return this.systemAlertTracker[agentId].canSend;
  }

  sendingSystemAlert(agentId: string) {
    this.ensureAlertTrackingEntityExists(agentId);
    this.systemAlertTracker[agentId].sendsSinceLast = 0;
    this.systemAlertTracker[agentId].canSend = false;
  }

  sendingUserMessage(agentId: string) {
    this.ensureAlertTrackingEntityExists(agentId);
    this.systemAlertTracker[agentId].sendsSinceLast++;
    if (this.systemAlertTracker[agentId].sendsSinceLast > 8) {
      this.systemAlertTracker[agentId].canSend = true;
    }
  }

  private ensureAlertTrackingEntityExists(agentId: string) {
    if (!this.systemAlertTracker[agentId]) {
      this.systemAlertTracker[agentId] = {
        sendsSinceLast: 0,
        canSend: true,
      };
    }
  }
}
