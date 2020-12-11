/**
 * Error thrown if the input variables don't have the expected type
 */
export default class UnexpectedInputError extends Error {
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
