class CustomError extends Error {
  status: number;

  constructor(message: string, statuscode: number) {
    super(message);
    this.status = statuscode;
  }
}

export { CustomError };
