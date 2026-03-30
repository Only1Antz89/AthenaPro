export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status = 400
  ) {
    super(message);
  }
}

export function toDisplayError(error: unknown) {
  if (error instanceof AppError) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}
