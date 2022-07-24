export class MessageError extends Error {
  constructor(
    msg: string,
    result: boolean,
    message: string[],
    messageLevels: string[]
  ) {
    super(msg);
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, MessageError.prototype);
    this.result = result;
    this.issues = message;
    this.name = "MessageError";
    this.issueLevels = messageLevels;
  }

  name: string = "";

  issueLevels: string[] = [];
  issues: string[] = [];
  result: boolean = false;
}
