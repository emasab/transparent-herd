/**
 * Error thrown if the batched function returns a result that isn't
 * an {@link Array} of {@link Promise}
 */
export class UnexpectedResultError extends Error {
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
