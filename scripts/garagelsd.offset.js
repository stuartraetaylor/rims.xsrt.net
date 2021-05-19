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
 * Garage LSD offset calculator.
 *
 * This is the script for the various offset calculators found on www.garagelsd.com
 *
 * @author Stuart Taylor - stu@taylor-net.co.uk
 * @version 2012-04-20
 */
var calculator = new OffsetCalculator();
$j(document).ready(function(){ calculator.clearAllNoFade(); });

function OffsetCalculator() {
  var results = null;
  var comparisonState = { width: 0, offset: 0, diameter: 0, minWidth: 8, maxWidth: 12 };

  register(this, "calculate",
  function(form) {
    if (!this.validate(new Array(form.oldInner, form.newInner, form.oldOuter, form.newOuter, form.wheelWidth, form.offset, form.spacers))) {
      form.reset();
      return;
    }

    this.autofill(form);
    var oldWidth = parseFloat(form.wheelWidth.value);
    var oldOffset = parseFloat(form.offset.value);
    var oldInner = parseFloat(form.oldInner.value);
    var newInner = parseFloat(form.newInner.value);
    var oldOuter = parseFloat(form.oldOuter.value);
    var newOuter = parseFloat(form.newOuter.value);
    var spacers = parseFloat(form.spacers.value);
    var diameter = 0;

    var innerDiff = newInner - oldInner;
    var outerDiff = newOuter - oldOuter;
    var newWidth = oldWidth + innerDiff + outerDiff;
    var newOffset = oldOffset + this.inchMM(innerDiff / 2) - this.inchMM(outerDiff / 2);
    var overallOffset = newOffset - spacers;
    var archDiff = 0 - this.inchMM(outerDiff) - spacers;
    var strutDiff = 0 - this.inchMM(innerDiff) + spacers;

    this.displayResults(oldWidth, oldOffset, newWidth, newOffset, overallOffset, archDiff, strutDiff);
    this.displayComparison(newWidth, overallOffset, diameter);
    this.showResults();
    this.storeResults(oldWidth, oldOffset, newWidth, overallOffset);

    if (oldWidth > 0) {
      this.displayLinks(oldWidth, oldOffset, newWidth, overallOffset, diameter);
    } else {
      this.clearLinks();
    }
  });

  register(this, "calculateEquivalents",
  function(form) {
    if (!this.validate(new Array(form.wheelWidth, form.diameter, form.offset, form.spacers))) {
      form.reset();
      return;
    }

    var width = parseFloat(form.wheelWidth.value);
    var offset = parseFloat(form.offset.value);
    var diameter = parseFloat(form.diameter.value);
    var spacers = parseFloat(form.spacers.value);
    var overallOffset = offset - spacers;

    this.displayComparison(width, overallOffset, diameter);
    this.showResults();
    this.storeResults(width, overallOffset);
  });

  register(this, "calculateFitment",
  function(form) {
    if (!this.validate(new Array(form.wheelWidth, form.offset, form.newWheelWidth, form.newOffset, form.spacers, form.diameter))) {
      form.reset();
      return;
    }

    var oldWidth = parseFloat(form.wheelWidth.value);
    var oldOffset = parseFloat(form.offset.value);
    var newWidth = parseFloat(form.newWheelWidth.value);
    var newOffset = parseFloat(form.newOffset.value);
    var diameter = parseFloat(form.diameter.value);
    var spacers = parseFloat(form.spacers.value);

    var widthDiff = this.inchMM(oldWidth / 2) - this.inchMM(newWidth / 2);
    var overallOffset = newOffset - spacers;
    var archDiff = widthDiff - oldOffset + newOffset - spacers;
    var strutDiff = widthDiff + oldOffset - newOffset + spacers;

    this.displayResults(oldWidth, oldOffset, newWidth, newOffset, overallOffset, archDiff, strutDiff);
    this.displayComparison(newWidth, overallOffset, diameter);
    this.showResults();
    this.storeResults(oldWidth, oldOffset, newWidth, overallOffset);

    if (oldWidth > 0) {
      this.displayLinks(oldWidth, oldOffset, newWidth, overallOffset, diameter);
    } else {
      this.clearLinks();
    }
  });

  register(this, "equivalentOffset", 
  function(compareWidth, width, offset) {
    return this.round(this.inchMM(compareWidth / 2) - this.inchMM(width / 2) + offset);
  });

  register(this, "initSlider",
  function() {
    if (!($j('#comparisonSlider').length > 0))
      return;
    
    var calculator = this;
    $j('#comparisonSlider').slider({
  	  min: 5, max: 11, step: 0.5,
      disabled: false,
      value: comparisonState.minWidth,
      stop: function(e,ui) { 
        comparisonState.minWidth = ui.value; 
        comparisonState.maxWidth = ui.value+4;
        calculator.displayComparison(comparisonState.width, comparisonState.offset, comparisonState.diameter);
      }
    });
  });
  
  register(this, "share",
  function(form) {
    $j('#share-dialog').dialog('open');
  });

  register(this, "displayComparison", 
  function(width, offset, diameter) {
    this.displayComparison(width, offset, diameter, comparisonState.minWidth, comparisonState.maxWidth, 0.5);
  });

  register(this, "displayComparison", 
  function(width, offset, diameter, min, max, inc) {
    comparisonState = { width: width, offset: offset, diameter: diameter, minWidth: min, maxWidth: max };
    var baseWheel = (width > 0) ? " <span style=\"font-weight: normal;\">(" + this.round(width) + "J et" + this.round(offset) + ")</span>" : '';
    var output = "<h4>Equivalent Arch Clearance" + baseWheel + "</h4>";
    output += "<table><tr><th>Width <span class=\"unit\">(<abbr title=\"inches\">in.</abbr>)</span></th>";  
    for (compareWidth = min; compareWidth <= max; compareWidth += inc)
      output += "<td>" + compareWidth + "</td>";
    output += "</tr><tr><th>Offset <span class=\"unit\">(<abbr title=\"millimetres\">mm</abbr>)</span></th>";
    for (compareWidth = min; compareWidth <= max; compareWidth += inc) {
      output += "<td>";
      if (width > 0)
        output += this.equivalentOffset(compareWidth, width, offset);
      else
        output += "-";
      output += "</td>";
    }
    output += "</tr><tr><th>RIMTUCK.com</th>";
    for (compareWidth = min; compareWidth <= max; compareWidth += inc) {
      output += "<td>";
      if (width > 0) {
        var compareOffset = this.equivalentOffset(compareWidth, width, offset);
        output += "<span class=\"rimtuck\">" + this.rimtuckFRLink(compareWidth, compareOffset, diameter, '/') + "</span>";
      }
      output += "</td>";
    }
    output += "</tr><th></th><td colspan=\"9\"><div id=\"comparisonSlider\"></div></td>";
    output += "</tr></table>";
    $j("#comparison").html(output);
    this.initSlider();
  });

  register(this, "displayResults", 
  function(oldWidth, oldOffset, newWidth, newOffset, overallOffset, archDiff, strutDiff) {
    newWidth = this.round(newWidth,2);
    newOffset = this.round(newOffset);
    overallOffset = this.round(overallOffset);
    archDiff = this.round(archDiff);
    strutDiff = this.round(strutDiff);

    $j("#old-width").html(oldWidth);
    $j("#old-offset").html(oldOffset);
    $j("#new-width").html(newWidth);
    $j("#new-offset").html(newOffset);
    $j("#overall-offset").html(overallOffset);
    $j("#arch-diff").html(this.formatDiff(archDiff));
    $j("#strut-diff").html(this.formatDiff(strutDiff));
  });

  register(this, "displayLinks", 
  function(oldWidth, oldOffset, newWidth, newOffset, diameter) {
    output  = "<span class=\"link\">RIMTUCK! " + this.rimtuckFRLink(newWidth, newOffset, diameter, " / ", "&nbsp;( ", " )") + "</span>";
    output += "<span class=\"link\"><a href=\"" + this.willTheyFit(oldWidth, oldOffset, newWidth, newOffset, diameter) + "\" target=\"_blank\" rel=\"external\" title=\"Compare with WillTheyFit.com\">Will They Fit?</a></span>"
    $j("#resource-links").html(output);
  });

  register(this, "storeResults",
  function(oldWidth, oldOffset, newWidth, newOffset) {
    this.results = (oldWidth == 0) ? null :
      this.formatToString(oldWidth, oldOffset) + " / " +
      this.formatToString(newWidth, newOffset);
  });

  register(this, "storeResults",
  function(width, offset) { this.results = (width == 0) ? null : this.formatToString(width, offset); });

  register(this, "formatToString",
  function(width, offset) {
    width = this.round(width,2);
    offset = this.round(offset);
    return width + "j et" + offset;
  });

  register(this, "rimtuckFRLink",
  function(width, offset, diameter, sep, before, after) {
    output  = before+"<a href=\"" + this.rimtuckFront(width, offset, diameter) + "\" target=\"_blank\" rel=\"external\" title=\"Front fitment on RIMTUCK.com\">F</a>";
    output += sep+"<a href=\"" + this.rimtuckRear(width, offset, diameter) + "\" target=\"_blank\" rel=\"external\" title=\"Rear fitment on RIMTUCK.com\">R</a>"+after;
    return output;
  });

  register(this, "rimtuckFRLink",
  function(width, offset, diameter, sep) { return this.rimtuckFRLink(width, offset, diameter, sep, '', ''); });

  register(this, "clearAllNoFade",
  function() {
    jQuery.fx.off = true; 
    this.clearall(); 
    jQuery.fx.off = false;
  });

  register(this, "clearall",
  function() {
    this.fadeOff(".results");
    this.clearResults();
    this.clearComparison();
    this.clearLinks();
    this.results = null;
  });

  register(this, "showResults",
  function() { this.fadeOn(".results"); });

  register(this, "clear",
  function(selector, value) { if ($j(selector).length > 0) $j(selector).html(value); });

  register(this, "clear",
  function(selector) { this.clear(selector,'') });

  register(this, "fadeOff",
  function(selector) { $j(selector).fadeTo('fast', 0.5); });

  register(this, "fadeOn",
  function(selector) { $j(selector).fadeTo('fast', 1.0); });

  register(this, "scrollTo",
  function(selector) { $j.scrollTo($j(selector), 500); });

  register(this, "clearResults",
  function() {
    this.clear("#old-width", '-');
    this.clear("#old-offset", '-');
    this.clear("#new-width", '-');
    this.clear("#new-offset", '-');
    this.clear("#overall-offset", '-');
    this.clear("#arch-diff", '-');
    this.clear("#strut-diff", '-');
  });

  register(this, "clearComparison", 
  function() { this.displayComparison(0,0,0); });

  register(this, "clearLinks",
  function() { this.clear("#resource-links"); });

  register(this, "formatDiff",
  function(diff) {
    if (diff < 0)
      return Math.abs(diff) + " LESS";
    else if (diff > 0)
      return diff + " MORE";
    else
      return "NO CHANGE";
  });

  register(this, "inchMM",
  function(inches) { return inches * 25.4; });

  register(this, "round",
  function round(b) { return this.round(b,1); });

  register(this, "round",
  function(b,n) { return Math.round(b*Math.pow(10,n)) / Math.pow(10,n); });

  register(this, "validate",
  function(fields) {
    var valid = true;

    for (i=0; i < fields.length; i++) {
      validField = this.isValidField(fields[i]);
      valid = validField ? valid : false;

      if (validField && !fields[i].name.match(/offset/gi)) 
        fields[i].value = Math.abs(fields[i].value);
    }

    return valid;
  });

  register(this, "isValidField",
  function(element) {
    var numeric = new RegExp("^[\+\-]?[0-9]+(\\.[0-9]*)?$");

    element.value = $j.trim(element.value);
    if (element.value.length == 0)
      element.value = "0";

    return numeric.test(element.value);
  });

  register(this, "autofill",
  function(form) {
    var wheelWidthValue = parseFloat(form.wheelWidth.value);
    var oldInnerValue = parseFloat(form.oldInner.value);
    var oldOuterValue = parseFloat(form.oldOuter.value);
    var newInnerValue = parseFloat(form.newInner.value);
    var newOuterValue = parseFloat(form.newOuter.value);

    if (wheelWidthValue < oldInnerValue || wheelWidthValue < oldOuterValue)
      wheelWidthValue = form.wheelWidth.value = 0;

    if (wheelWidthValue != 0 && oldInnerValue != 0 && oldOuterValue == 0)
      oldOuterValue = form.oldOuter.value = wheelWidthValue - oldInnerValue;
    if (wheelWidthValue != 0 && oldInnerValue == 0 && oldOuterValue != 0)
      oldInnerValue = form.oldInner.value = wheelWidthValue - oldOuterValue;
    if (wheelWidthValue == 0 && oldInnerValue != 0 && oldOuterValue != 0)
      wheelWidthValue = form.wheelWidth.value = oldInnerValue + oldOuterValue;

    if (wheelWidthValue != (oldInnerValue + oldOuterValue))
      wheelWidthValue = form.wheelWidth.value = oldInnerValue + oldOuterValue;

    if (oldInnerValue != 0 && newInnerValue == 0)
      newInnerValue = form.newInner.value = oldInnerValue;
    if (oldOuterValue != 0 && newOuterValue == 0)
      newOuterValue = form.newOuter.value = oldOuterValue;
  });

  register(this, "willTheyFit",
  function(oldWidth, oldOffset, newWidth, newOffset, diameter) {
    newWidth = this.round(newWidth,2);
    newOffset = this.round(newOffset);
    return "http://www.willtheyfit.com/index.php?" +
      "width=225" +
      "&aspect=45" +
      "&diameter=" + ((diameter > 0) ? diameter : '17') +
      "&width2=225" +
      "&aspect2=45" +
      "&diameter2=" + ((diameter > 0) ? diameter : '17') +
      "&wheelwidth=" + oldWidth +
      "&offset=" + oldOffset +
      "&wheelwidth2=" + newWidth +
      "&offset2=" + newOffset;
  });

  register(this, "rimtuck",
  function(width, offset, diameter, o) {
    var sign = this.rimtuckSign(offset);
    width = this.round(width);
    offset = this.round(offset,0);
    return "http://www.rimtuck.com/search/thumbnails" +
      "&width"+o+"=" + width +
      "&offset"+o+"=" + Math.abs(offset) +
      "&sign"+o+"=" + sign +
      ((diameter > 0) ? "&diameter"+o+"=" + diameter : '') +
      "&sort=1";
  });

  register(this, "rimtuckFront",
  function(width, offset, diameter) { return this.rimtuck(width, offset, diameter, 'f'); });

  register(this, "rimtuckRear",
  function(width, offset, diameter) { return this.rimtuck(width, offset, diameter, 'r'); });

  register(this, "rimtuckSign",
  function(n) { return (n < 0) ? "-" : "%2B"; });

  register(this, "demo",
  function(type, n) {
    $j("#offset-calculator form").reset();
    switch (type) {
      case "split-rim":
        switch (n) {
          case 1:
            $j("#oldOuter").val("1");
            $j("#newOuter").val("3.5");
            $j("#wheelWidth").val("8");
            $j("#offset").val("32");
            break;
          case 2:
            $j("#oldOuter").val("2");
            $j("#newOuter").val("4");
            $j("#oldInner").val("8");
            $j("#newInner").val("7");
            $j("#offset").val("45");
            break;
        }
        break;
      case "offset-comparison":
        $j("#wheelWidth").val("9.5");
        $j("#offset").val("12");
        break;
      case "wheel-fitment":
        $j("#wheelWidth").val("8");
        $j("#offset").val("30");
        $j("#newWheelWidth").val("9.5");
        $j("#newOffset").val("12");
        break;
    }
    this.scrollTo("#offset-calculator");
  });
}
