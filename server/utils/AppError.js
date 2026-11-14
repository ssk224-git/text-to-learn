// An error that is safe to show to the user, with the HTTP status to send.
export class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.expose = true;
  }
}
