const api = require('./util/api');

/**
 *  Public functions on misc ad actions
 *  --------------------------
 *  getAllOthers(opts)
 *  getAll(opts)
 */

module.exports = {
  async getAllOthers(opts) {
    return await this._findByType(opts, ['other']);
  },

  async getAll(opts) {
    return await this._findByType(opts, ['all']);
  },

  /**
   *
   * @param {*} date - The date to be converted in YYYY-MM-DD HH:mm:ss OR YYYY-MM-DDTHH:mm:ss OR YYYY-MM-DD
   */
  convertToADDate(date) {
    return api.convertDateToAD(date);
  },

  convertFromADDate(date) {
    return api.convertDateFromAD(date);
  }
};
