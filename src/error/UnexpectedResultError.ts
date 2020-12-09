/**
 * Error thrown if the batched function returns a result that isn't
 * an @Array of @Promise
 */
export default class UnexpectedResultError extends Error {
  data: any;

  /**
   * Constructor taking an object with message property
   * @param {Object} error the error object with message property
   * and additional properties
   */
  constructor(error: { message: string }) {
    super(error.message);
    this.data = { error };
  }
}
