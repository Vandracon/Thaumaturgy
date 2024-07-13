export class BaseRouter {
  private baseUrl: string;

  constructor() {
    this.baseUrl = "/api/v1";
  }

  protected buildEndpoint(path: string) {
    return `${this.baseUrl}/${path}`;
  }
}
