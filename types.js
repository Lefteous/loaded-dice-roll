/**
 * @typedef Die
 * @property {number} faces
 * @property {Array<{result:number}>} results
 * @exports Die
 */

/**
 * @exports Roll
 * @typedef Roll
 * @property {string} formula
 * @property {Array<Die|string|number>} terms
 * @function evaluate
 * @property {number} _total
 */

/**
 * @typedef ParsedTarget
 * @property {string} condition
 * @property {number} value
 * @exports ParsedTarget
 */

export const no = () => {};
