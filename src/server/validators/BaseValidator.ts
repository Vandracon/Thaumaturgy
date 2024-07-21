export class ValidationResult {
  constructor(
    public passed: boolean,
    public data: any,
  ) {}
}

export class BaseValidator {
  protected returnResult(passed: boolean, data: Array<string>) {
    return new ValidationResult(passed, data);
  }
}
