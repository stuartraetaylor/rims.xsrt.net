/**
 * Offset Calculator Core — pure calculation logic.
 * No DOM, no jQuery. Testable in Node or browser.
 */
(function(exports) {

  var core = {};

  /** Convert inches to millimetres. */
  core.inchMM = function(inches) {
    return inches * 25.4;
  };

  /** Round a number to n decimal places (default 1). */
  core.round = function(value, n) {
    n = (n === undefined) ? 1 : n;
    var factor = Math.pow(10, n);
    return Math.round(value * factor) / factor;
  };

  /**
   * Split rim offset calculation.
   * @param {object} input - { oldInner, newInner, oldOuter, newOuter, wheelWidth, offset, spacers }
   * @returns {{ newWidth, newOffset, overallOffset, archDiff, strutDiff }}
   */
  core.calculateSplitRim = function(input) {
    var innerDiff = input.newInner - input.oldInner;
    var outerDiff = input.newOuter - input.oldOuter;
    var newWidth = input.wheelWidth + innerDiff + outerDiff;
    var newOffset = input.offset + core.inchMM(innerDiff / 2) - core.inchMM(outerDiff / 2);
    var overallOffset = newOffset - input.spacers;
    var archDiff = 0 - core.inchMM(outerDiff) - input.spacers;
    var strutDiff = 0 - core.inchMM(innerDiff) + input.spacers;

    return {
      newWidth: core.round(newWidth, 2),
      newOffset: core.round(newOffset),
      overallOffset: core.round(overallOffset),
      archDiff: core.round(archDiff),
      strutDiff: core.round(strutDiff)
    };
  };

  /**
   * Wheel fitment comparison calculation.
   * @param {object} input - { oldWidth, oldOffset, newWidth, newOffset, spacers }
   * @returns {{ overallOffset, archDiff, strutDiff }}
   */
  core.calculateFitment = function(input) {
    var widthDiff = core.inchMM(input.oldWidth / 2) - core.inchMM(input.newWidth / 2);
    var overallOffset = input.newOffset - input.spacers;
    var archDiff = widthDiff - input.oldOffset + input.newOffset - input.spacers;
    var strutDiff = widthDiff + input.oldOffset - input.newOffset + input.spacers;

    return {
      overallOffset: core.round(overallOffset),
      archDiff: core.round(archDiff),
      strutDiff: core.round(strutDiff)
    };
  };

  /**
   * Calculate the equivalent offset for a given comparison width.
   * @returns {number} The offset that gives the same arch clearance.
   */
  core.equivalentOffset = function(compareWidth, width, offset) {
    return core.round(core.inchMM(compareWidth / 2) - core.inchMM(width / 2) + offset);
  };

  /**
   * Generate an equivalent arch clearance table.
   * @returns {Array<{width: number, offset: number}>}
   */
  core.equivalentTable = function(width, offset, minWidth, maxWidth, inc) {
    var results = [];
    for (var w = minWidth; w <= maxWidth; w += inc) {
      results.push({
        width: w,
        offset: (width > 0) ? core.equivalentOffset(w, width, offset) : null
      });
    }
    return results;
  };

  /**
   * Format a clearance difference for display.
   * @returns {string} "X LESS", "X MORE", or "NO CHANGE"
   */
  core.formatDiff = function(diff) {
    if (diff < 0) return Math.abs(diff) + " LESS";
    if (diff > 0) return diff + " MORE";
    return "NO CHANGE";
  };

  /**
   * Format wheel spec as a string (e.g. "8j et32").
   */
  core.formatToString = function(width, offset) {
    return core.round(width, 2) + "j et" + core.round(offset);
  };

  /**
   * Check if a string value is a valid numeric input.
   * Treats empty/blank as valid (defaults to 0).
   * @returns {{ valid: boolean, value: string }}
   */
  core.validateField = function(value) {
    var numeric = /^[+\-]?[0-9]+(\.[0-9]*)?$/;
    value = value.trim();
    if (value.length === 0) value = "0";
    return { valid: numeric.test(value), value: value };
  };

  /**
   * Autofill split rim form values.
   * Infers missing values from the relationship: wheelWidth = oldInner + oldOuter.
   * @param {object} input - { oldInner, oldOuter, newInner, newOuter, wheelWidth }
   * @returns {object} Corrected values with same keys.
   */
  core.autofill = function(input) {
    var result = {
      oldInner: input.oldInner,
      oldOuter: input.oldOuter,
      newInner: input.newInner,
      newOuter: input.newOuter,
      wheelWidth: input.wheelWidth
    };

    if (result.wheelWidth < result.oldInner || result.wheelWidth < result.oldOuter)
      result.wheelWidth = 0;

    if (result.wheelWidth !== 0 && result.oldInner !== 0 && result.oldOuter === 0)
      result.oldOuter = result.wheelWidth - result.oldInner;
    if (result.wheelWidth !== 0 && result.oldInner === 0 && result.oldOuter !== 0)
      result.oldInner = result.wheelWidth - result.oldOuter;
    if (result.wheelWidth === 0 && result.oldInner !== 0 && result.oldOuter !== 0)
      result.wheelWidth = result.oldInner + result.oldOuter;

    if (result.wheelWidth !== (result.oldInner + result.oldOuter))
      result.wheelWidth = result.oldInner + result.oldOuter;

    if (result.oldInner !== 0 && result.newInner === 0)
      result.newInner = result.oldInner;
    if (result.oldOuter !== 0 && result.newOuter === 0)
      result.newOuter = result.oldOuter;

    return result;
  };

  /**
   * Build a WillTheyFit.com comparison URL.
   */
  core.willTheyFitUrl = function(oldWidth, oldOffset, newWidth, newOffset, diameter) {
    newWidth = core.round(newWidth, 2);
    newOffset = core.round(newOffset);
    var d = (diameter > 0) ? diameter : 17;
    return "http://www.willtheyfit.com/index.php?" +
      "width=225&aspect=45&diameter=" + d +
      "&width2=225&aspect2=45&diameter2=" + d +
      "&wheelwidth=" + oldWidth + "&offset=" + oldOffset +
      "&wheelwidth2=" + newWidth + "&offset2=" + newOffset;
  };

  /**
   * Build a RIMTUCK.com search URL.
   * @param {string} position - 'f' for front, 'r' for rear
   */
  core.rimtuckUrl = function(width, offset, diameter, position) {
    var sign = (offset < 0) ? "-" : "%2B";
    width = core.round(width);
    offset = core.round(offset, 0);
    return "http://www.rimtuck.com/search/thumbnails" +
      "&width" + position + "=" + width +
      "&offset" + position + "=" + Math.abs(offset) +
      "&sign" + position + "=" + sign +
      ((diameter > 0) ? "&diameter" + position + "=" + diameter : "") +
      "&sort=1";
  };

  // Universal module export (browser global + Node.js)
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = core;
  } else {
    exports.OffsetCalculatorCore = core;
  }

})(typeof window !== 'undefined' ? window : this);
