/**
 * Error thrown if the input variables don't have the expected type
 */
export class UnexpectedInputError extends Error {
  data: Record<string, unknown>;

  /**
   * Constructor taking an object with message property
   * @param error - the error object with message property
   * and additional properties
   */
  constructor(error: { message: string }) {
    super(error.message);
    this.data = { error };
  }
}
