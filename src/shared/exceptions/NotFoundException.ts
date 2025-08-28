import { HttpException } from "./HttpException";

export class NotFoundException extends HttpException {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}