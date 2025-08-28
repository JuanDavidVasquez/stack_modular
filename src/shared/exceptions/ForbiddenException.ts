export class ForbiddenException extends Error {
  public status: number;
  public code: string;

  constructor(message: string) {
    super(message);
    this.status = 403;
    this.code = "FORBIDDEN";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}