/* Copyright (c) 2010, Stuart Taylor (stu@taylor-net.co.uk)
 * All rights reserved.
 * 
 * Redistribution  and  use  in  source  and  binary   forms,  with  or  without
 * modification, are permitted provided that the following conditions are met:
 *
 *     1. Redistributions  of  source  code  must  retain  the  above  copyright
 *        notice, this list of conditions and the following disclaimer.
 *     2. Redistributions  in binary  form must  reproduce the  above  copyright
 *        notice,  this list of conditions  and the following  disclaimer in the
 *        documentation and/or other materials provided with the distribution.
 * 
 * THIS SOFTWARE IS  PROVIDED BY THE COPYRIGHT HOLDERS AND  CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES,  INCLUDING,  BUT   NOT LIMITED TO, THE
 * IMPLIED  WARRANTIES  OF   MERCHANTABILITY  AND   FITNESS  FOR  A   PARTICULAR
 * PURPOSEARE   DISCLAIMED.  IN  NO  EVENT  SHALL  THE  COPYRIGHT    HOLDER   OR
 * CONTRIBUTORS  BE  LIABLE  FOR ANY  DIRECT,  INDIRECT,  INCIDENTAL,   SPECIAL,
 * EXEMPLARY,  OR  CONSEQUENTIAL   DAMAGES  (INCLUDING,   BUT  NOT  LIMITED  TO,
 * PROCUREMENT OF  SUBSTITUTE  GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
 * OR  BUSINESS  INTERRUPTION)  HOWEVER  CAUSED AND ON ANY  THEORY OF LIABILITY,
 * WHETHER  IN  CONTRACT,  STRICT  LIABILITY, OR  TORT (INCLUDING  NEGLIGENCE OR
 * OTHERWISE)  ARISING  IN  ANY  WAY  OUT OF THE USE OF THIS  SOFTWARE,  EVEN IF
 * ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * Garage LSD offset calculator — DOM interaction layer.
 * Uses OffsetCalculatorCore for all calculations.
 */
const $j = jQuery.noConflict();
jQuery.fn.reset = function() { $j(this).each(function() { this.reset(); }); };

class OffsetCalculator {
  constructor() {
    this.core = OffsetCalculatorCore;
    this.results = null;
    this.comparisonState = { width: 0, offset: 0, diameter: 0, minWidth: 8, maxWidth: 12 };
  }

  calculate(form) {
    if (!this.validateForm([form.oldInner, form.newInner, form.oldOuter, form.newOuter, form.wheelWidth, form.offset, form.spacers])) {
      form.reset();
      return;
    }

    this.autofillForm(form);

    const result = this.core.calculateSplitRim({
      oldInner: parseFloat(form.oldInner.value),
      newInner: parseFloat(form.newInner.value),
      oldOuter: parseFloat(form.oldOuter.value),
      newOuter: parseFloat(form.newOuter.value),
      wheelWidth: parseFloat(form.wheelWidth.value),
      offset: parseFloat(form.offset.value),
      spacers: parseFloat(form.spacers.value)
    });

    const oldWidth = parseFloat(form.wheelWidth.value);
    const oldOffset = parseFloat(form.offset.value);

    this.displayResults(oldWidth, oldOffset, result.newWidth, result.newOffset, result.overallOffset, result.archDiff, result.strutDiff);
    this.displayComparison(result.newWidth, result.overallOffset, 0);
    this.showResults();
    this.storeResults(oldWidth, oldOffset, result.newWidth, result.overallOffset);

    if (oldWidth > 0) {
      this.displayLinks(oldWidth, oldOffset, result.newWidth, result.overallOffset, 0);
    } else {
      this.clearLinks();
    }
  }

  calculateEquivalents(form) {
    if (!this.validateForm([form.wheelWidth, form.diameter, form.offset, form.spacers])) {
      form.reset();
      return;
    }

    const width = parseFloat(form.wheelWidth.value);
    const offset = parseFloat(form.offset.value);
    const diameter = parseFloat(form.diameter.value);
    const spacers = parseFloat(form.spacers.value);
    const overallOffset = offset - spacers;

    this.displayComparison(width, overallOffset, diameter);
    this.showResults();
    this.storeResults(width, overallOffset);
  }

  calculateFitment(form) {
    if (!this.validateForm([form.wheelWidth, form.offset, form.newWheelWidth, form.newOffset, form.spacers, form.diameter])) {
      form.reset();
      return;
    }

    const oldWidth = parseFloat(form.wheelWidth.value);
    const oldOffset = parseFloat(form.offset.value);
    const newWidth = parseFloat(form.newWheelWidth.value);
    const newOffset = parseFloat(form.newOffset.value);
    const diameter = parseFloat(form.diameter.value);
    const spacers = parseFloat(form.spacers.value);

    const result = this.core.calculateFitment({
      oldWidth, oldOffset, newWidth, newOffset, spacers
    });

    this.displayResults(oldWidth, oldOffset, newWidth, newOffset, result.overallOffset, result.archDiff, result.strutDiff);
    this.displayComparison(newWidth, result.overallOffset, diameter);
    this.showResults();
    this.storeResults(oldWidth, oldOffset, newWidth, result.overallOffset);

    if (oldWidth > 0) {
      this.displayLinks(oldWidth, oldOffset, newWidth, result.overallOffset, diameter);
    } else {
      this.clearLinks();
    }
  }

  displayComparison(width, offset, diameter, min, max, inc) {
    const state = this.comparisonState;
    min = min ?? state.minWidth;
    max = max ?? state.maxWidth;
    inc = inc ?? 0.5;

    this.comparisonState = { width, offset, diameter, minWidth: min, maxWidth: max };
    const table = this.core.equivalentTable(width, offset, min, max, inc);

    const baseWheel = (width > 0)
      ? ` <span style="font-weight: normal;">(${this.core.round(width)}J et${this.core.round(offset)})</span>` : '';

    let output = `<h4>Equivalent Arch Clearance${baseWheel}</h4>`;
    output += `<table><tr><th>Width <span class="unit">(<abbr title="inches">in.</abbr>)</span></th>`;
    for (const entry of table) output += `<td>${entry.width}</td>`;

    output += `</tr><tr><th>Offset <span class="unit">(<abbr title="millimetres">mm</abbr>)</span></th>`;
    for (const entry of table) output += `<td>${entry.offset ?? '-'}</td>`;

    output += `</tr><tr><th>RIMTUCK.com</th>`;
    for (const entry of table) {
      output += '<td>';
      if (entry.offset !== null) {
        output += `<span class="rimtuck">${this.rimtuckFRLink(entry.width, entry.offset, diameter, '/')}</span>`;
      }
      output += '</td>';
    }

    output += `</tr><th></th><td colspan="9"><input type="range" id="comparisonSlider" min="5" max="11" step="0.5" value="${min}" class="w-full my-3 mx-0" /></td>`;
    output += '</tr></table>';

    $j('#comparison').html(output);
    this.initSlider();
  }

  initSlider() {
    const el = document.getElementById('comparisonSlider');
    if (!el) return;

    el.value = this.comparisonState.minWidth;
    el.addEventListener('change', () => {
      this.comparisonState.minWidth = parseFloat(el.value);
      this.comparisonState.maxWidth = this.comparisonState.minWidth + 4;
      this.displayComparison(this.comparisonState.width, this.comparisonState.offset, this.comparisonState.diameter);
    });
  }

  displayResults(oldWidth, oldOffset, newWidth, newOffset, overallOffset, archDiff, strutDiff) {
    $j('#old-width').html(oldWidth);
    $j('#old-offset').html(oldOffset);
    $j('#new-width').html(newWidth);
    $j('#new-offset').html(newOffset);
    $j('#overall-offset').html(overallOffset);
    $j('#arch-diff').html(this.core.formatDiff(archDiff));
    $j('#strut-diff').html(this.core.formatDiff(strutDiff));
  }

  displayLinks(oldWidth, oldOffset, newWidth, newOffset, diameter) {
    const rw = this.core.round(newWidth, 2);
    const ro = this.core.round(newOffset);
    let output = `<span class="link">RIMTUCK! ${this.rimtuckFRLink(rw, ro, diameter, ' / ', '&nbsp;( ', ' )')}</span>`;
    output += `<span class="link"><a href="${this.core.willTheyFitUrl(oldWidth, oldOffset, newWidth, newOffset, diameter)}" target="_blank" rel="external" title="Compare with WillTheyFit.com">Will They Fit?</a></span>`;
    $j('#resource-links').html(output);
  }

  storeResults(oldWidth, oldOffset, newWidth, newOffset) {
    if (arguments.length === 2) {
      this.results = (oldWidth === 0) ? null : this.core.formatToString(oldWidth, oldOffset);
    } else {
      this.results = (oldWidth === 0) ? null :
        `${this.core.formatToString(oldWidth, oldOffset)} / ${this.core.formatToString(newWidth, newOffset)}`;
    }
  }

  rimtuckFRLink(width, offset, diameter, sep, before = '', after = '') {
    const frontUrl = this.core.rimtuckUrl(width, offset, diameter, 'f');
    const rearUrl = this.core.rimtuckUrl(width, offset, diameter, 'r');
    return `${before}<a href="${frontUrl}" target="_blank" rel="external" title="Front fitment on RIMTUCK.com">F</a>${sep}<a href="${rearUrl}" target="_blank" rel="external" title="Rear fitment on RIMTUCK.com">R</a>${after}`;
  }

  validateForm(fields) {
    let valid = true;
    for (const field of fields) {
      const result = this.core.validateField(field.value);
      field.value = result.value;
      if (!result.valid) {
        valid = false;
      } else if (!field.name.match(/offset/gi)) {
        field.value = Math.abs(parseFloat(field.value));
      }
    }
    return valid;
  }

  autofillForm(form) {
    const filled = this.core.autofill({
      oldInner: parseFloat(form.oldInner.value),
      oldOuter: parseFloat(form.oldOuter.value),
      newInner: parseFloat(form.newInner.value),
      newOuter: parseFloat(form.newOuter.value),
      wheelWidth: parseFloat(form.wheelWidth.value)
    });
    form.oldInner.value = filled.oldInner;
    form.oldOuter.value = filled.oldOuter;
    form.newInner.value = filled.newInner;
    form.newOuter.value = filled.newOuter;
    form.wheelWidth.value = filled.wheelWidth;
  }

  clearAllNoFade() {
    jQuery.fx.off = true;
    this.clearall();
    jQuery.fx.off = false;
  }

  clearall() {
    this.fadeOff('.results');
    this.clearResults();
    this.clearComparison();
    this.clearLinks();
    this.results = null;
  }

  showResults() { this.fadeOn('.results'); }

  clear(selector, value = '') {
    if ($j(selector).length > 0) $j(selector).html(value);
  }

  fadeOff(selector) { $j(selector).fadeTo('fast', 0.5); }
  fadeOn(selector) { $j(selector).fadeTo('fast', 1.0); }

  scrollTo(selector) {
    document.querySelector(selector).scrollIntoView({ behavior: 'smooth' });
  }

  clearResults() {
    for (const id of ['#old-width', '#old-offset', '#new-width', '#new-offset', '#overall-offset', '#arch-diff', '#strut-diff']) {
      this.clear(id, '-');
    }
  }

  clearComparison() { this.displayComparison(0, 0, 0); }
  clearLinks() { this.clear('#resource-links'); }

  demo(type, n) {
    $j('#offset-calculator form').reset();
    switch (type) {
      case 'split-rim':
        if (n === 1) {
          $j('#oldOuter').val('1');
          $j('#newOuter').val('3.5');
          $j('#wheelWidth').val('8');
          $j('#offset').val('32');
        } else if (n === 2) {
          $j('#oldOuter').val('2');
          $j('#newOuter').val('4');
          $j('#oldInner').val('8');
          $j('#newInner').val('7');
          $j('#offset').val('45');
        }
        break;
      case 'offset-comparison':
        $j('#wheelWidth').val('9.5');
        $j('#offset').val('12');
        break;
      case 'wheel-fitment':
        $j('#wheelWidth').val('8');
        $j('#offset').val('30');
        $j('#newWheelWidth').val('9.5');
        $j('#newOffset').val('12');
        break;
    }
    this.scrollTo('#offset-calculator');
  }
}

const calculator = new OffsetCalculator();
$j(document).ready(() => calculator.clearAllNoFade());
