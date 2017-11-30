(function ($) {
  // Start of use strict

  // Smooth scrolling using jQuery easing
  $('a.js-scroll-trigger[href*="#"]:not([href="#"])').click(function () {
    if (window.location.pathname.replace(/^\//, '') === this.pathname.replace(/^\//, '') && window.location.hostname === this.hostname) {
      let target = $(this.hash);
      target = target.length ? target : $(`[name=${this.hash.slice(1)}]`);
      if (target.length) {
        $('html, body').animate({
          scrollTop: (target.offset().top - 48),
        }, 1000, 'easeInOutExpo');
        return false;
      }
    }
    return null;
  });
}(window.jQuery)); // End of use strict

function resizeIframe(obj) {
  if (obj.style.height <= '250px') {
    obj.style.height = '250px';
  } else {
    obj.style.height = obj.contentWindow.document.body.scrollHeight + 'px';    
  }
  obj.style.width = '100%';
}