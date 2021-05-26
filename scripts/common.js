$j=jQuery.noConflict();
jQuery.fn.reset = function () { $j(this).each (function() { this.reset(); }); }

function register(object, name, fn) {
  // addMethod - By John Resig (MIT Licensed)
  var old = object[name];
  object[name] = function() {
  if (fn.length == arguments.length)
    return fn.apply(this, arguments);
  else if (typeof old == "function")
    return old.apply(this, arguments);
  };
}

function trackEvent(category, action, label) {
  if (typeof _gaq != 'undefined' && label != null)
    _gaq.push(['_trackEvent', category, action, label]);
}

function trackAction(category, action) {
  if (typeof _gaq != 'undefined')
    _gaq.push(['_trackEvent', category, action]);
}

