/* eslint no-unused-vars: ["error", { "varsIgnorePattern": "_" }] */

// RegEx test for root path references. Groups relative path for extraction.
var regexPath_ = /^projects\/.+?\/databases\/\(default\)\/documents\/(.+\/.+)$/
// RegEx test for testing for binary data by checking for non-printable characters.
// Parsing strings for binary data is completely dependent on the data being sent over.
var regexBinary_ = /[\x00-\x08\x0E-\x1F]/ // eslint-disable-line no-control-regex
// RegEx test for finding and capturing milliseconds.
// Apps Scripts doesn't support RFC3339 Date Formats, nanosecond precision must be trimmed.
var regexDatePrecision_ = /(\.\d{3})\d+/

/**
 * Checks if a number is an integer.
 *
 * @private
 * @param {value} n value to check
 * @returns {boolean} true if value can be coerced into an integer, false otherwise
 */
function isInt_ (n) {
  return n % 1 === 0
}

/**
 * Check if a value is a valid number.
 *
 * @private
 * @param {value} val value to check
 * @returns {boolean} true if a valid number, false otherwise
 */
function isNumeric_ (val) {
  return Number(parseFloat(val)) === val
}

/**
 * Check if a value is of type Number but is NaN.
 * This check prevents seeing non-numeric values as NaN.
 *
 * @private
 * @param {value} value value to check
 * @returns {boolean} true if NaN, false otherwise
 */
function isNumberNaN_ (value) {
  return typeof (value) === 'number' && isNaN(value)
}

/**
 * Send HTTP request with provided options
 *
 * @private
 * @param {string} url Location path to send request to
 * @param {object} options HTTP related options to send
 * @returns {object} Response object from HTTP request
 */
function fetchObject_ (url, options) {
  const response = UrlFetchApp.fetch(url, options)
  const responseObj = JSON.parse(response.getContentText())
  checkForError_(responseObj)
  return responseObj
}

/**
 * Validate response object for errors
 *
 * @private
 * @param {object} responseObj HTTP response object to validate
 * @throws Error if HTTP requests errors found
 */
function checkForError_ (responseObj) {
  if (responseObj.error) {
    throw new Error(responseObj.error.message)
  }
  if (Array.isArray(responseObj) && responseObj.length && responseObj[0].error) {
    throw new Error(responseObj[0].error.message)
  }
}

/**
 * Gets collection of documents with the given path
 *
 * @private
 * @param {string} path Collection path
 * @returns {array} Collection of documents
 */
function getCollectionFromPath_ (path) {
  return getColDocFromPath_(path, false)
}

/**
 * Gets document with the given path
 *
 * @private
 * @param {string} path Document path
 * @returns {object} Document object
 */
function getDocumentFromPath_ (path) {
  return getColDocFromPath_(path, true)
}

/**
 * Gets collection or document with the given path
 *
 * @private
 * @param {string} path Document/Collection path
 * @returns {array|object} Collection of documents or a single document
 */
function getColDocFromPath_ (path, isDocument) {
  // Path defaults to empty string if it doesn't exist. Remove insignificant slashes.
  const splitPath = (path || '').split('/').filter(function (p) {
    return p
  })
  const len = splitPath.length

  cleanParts_(splitPath)

  // Set item path to document if isDocument, otherwise set to collection if exists.
  // This works because path is always in the format of "collection/document/collection/document/etc.."
  const item = len && len & 1 ^ isDocument ? splitPath.splice(len - 1, 1)[0] : ''

  // Remainder of path is in splitPath. Put back together and return.
  return [splitPath.join('/'), item]
}

/**
 * Validates Collection and Document names
 *
 * @private
 * @see {@link https://firebase.google.com/docs/firestore/quotas#collections_documents_and_fields Firestore Limits}
 * @param {array} parts Array of strings representing document path
 * @returns {array} of URI Encoded path names
 * @throws {Error} Validation errors if it doesn't meet API guidelines
 */
function cleanParts_ (parts) {
  return parts.map(function (part, i) {
    var type = i & 1 ? 'Collection' : 'Document'
    if (part === '.' || part === '..') { throw new TypeError(type + ' name cannot solely consist of a single period (.) or double periods (..)') }
    if (part.indexOf('__') === 0 && part.endsWith('__')) { throw new TypeError(type + ' name cannot be a dunder name (begin and end with double underscores)') }
    return encodeURIComponent(part)
  })
}

/**
 * Splits up path to be cleaned
 *
 * @private
 * @param {string} path to be cleaned
 * @returns {string} path that is URL-safe
 */
function cleanPath_ (path) {
  return cleanParts_(path.split('/')).join('/')
}
