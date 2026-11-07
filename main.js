/* Navigation, opt-in playback and progressive enhancement for a static site. */
(function () {
  'use strict';
  var nav = document.querySelector('nav');
  var menu = document.querySelector('.menu-toggle');
  function closeMenu() {
    if (!menu || !nav) return;
    menu.setAttribute('aria-expanded', 'false');
    nav.classList.remove('menu-open');
  }
  if (nav && menu) {
    // A browser may blur a link as a media query hides it, before resize fires.
    var lastNavigationFocus = null;
    nav.addEventListener('focusin', function (event) { lastNavigationFocus = event.target; });
    document.addEventListener('focusin', function (event) { if (!nav.contains(event.target)) lastNavigationFocus = null; });
    menu.addEventListener('click', function () {
      var open = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('menu-open', open);
    });
    nav.querySelectorAll('a').forEach(function (link) { link.addEventListener('click', closeMenu); });
    document.addEventListener('pointerdown', function (event) {
      if (!nav.contains(event.target)) { lastNavigationFocus = null; closeMenu(); }
    });
    nav.addEventListener('focusout', function (event) {
      if (!nav.contains(event.relatedTarget)) closeMenu();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
        closeMenu(); menu.focus();
      }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1000) {
        var wasMenu = document.activeElement === menu;
        closeMenu();
        if (wasMenu) nav.querySelector('a').focus();
      } else if (menu.getAttribute('aria-expanded') !== 'true' && document.querySelector('#navLinks').contains(lastNavigationFocus)) {
        menu.focus();
      }
    });
    function onScroll() { nav.classList.toggle('scrolled', window.scrollY > 24); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    // Collapse links only after their controls have working handlers.
    nav.classList.add('has-menu');
    document.documentElement.classList.add('menu-ready');
  }
  document.querySelectorAll('[data-print]').forEach(function (button) {
    button.hidden = false;
    button.addEventListener('click', function () { window.print(); });
  });
  document.querySelectorAll('[data-youtube]').forEach(function (link) {
    var host = link.closest('[data-video-host]');
    var close = host && host.parentElement.querySelector('.video-close');
    function unloadPlayer(returnFocus) {
      if (!host) return;
      var active = host.querySelector('iframe');
      if (!active) return;
      active.replaceWith(link);
      if (close) close.hidden = true;
      if (returnFocus) link.focus();
    }
    if (close) close.addEventListener('click', function () { unloadPlayer(true); });
    document.querySelectorAll('video').forEach(function (video) {
      video.addEventListener('play', function () {
        var focusWasInside = host && (host.contains(document.activeElement) || document.activeElement === close);
        unloadPlayer(focusWasInside);
      });
    });
    link.addEventListener('click', function (event) {
      // Preserve modifier-click and the separate direct link as ordinary navigation.
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      document.querySelectorAll('video').forEach(function (video) { video.pause(); });
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(link.dataset.youtube) + '?autoplay=1';
      iframe.title = link.dataset.title || 'Derek Rue: live performance on YouTube';
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.className = 'activated-player';
      link.replaceWith(iframe);
      if (close) close.hidden = false;
      iframe.focus();
    });
  });
  var form = document.querySelector('.contact-form');
  if (!form) return;
  var date = document.getElementById('date');
  var today = new Date();
  if (date) date.min = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  var copy = form.querySelector('.copy-draft');
  var copyStatus = document.getElementById('copy-status');
  var fields = form.querySelector('fieldset');
  var receipt = form.querySelector('.enquiry-receipt');
  var acceptedText = '';
  function enquiryText() {
    var labels = {name:'Name',email:'Email',company:'Company / organisation',event:'Event type',date:'Date',venue:'Venue / town',guests:'Approximate guests',message:'Event details'};
    return 'Opera Lux Events: booking enquiry\n\n' + Object.keys(labels).map(function (key) {
      return labels[key] + ': ' + (form.elements[key].value.trim() || 'Not specified');
    }).join('\n') + '\n\nSend to agency@operaluxevents.com';
  }
  if (copy) {
    copy.hidden = false;
    copy.addEventListener('click', async function () {
      var value = acceptedText || enquiryText();
      try {
        if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(value);
        document.getElementById('copy-fallback').hidden = true;
        copyStatus.textContent = acceptedText ? 'Submitted enquiry copied for your records.' : 'Enquiry copied. Paste it into your email to agency@operaluxevents.com. It has not been sent.';
      } catch (error) {
        var fallback = document.getElementById('copy-fallback');
        var textarea = document.getElementById('enquiry-copy');
        fallback.hidden = false;
        textarea.value = value;
        textarea.focus(); textarea.select();
        copyStatus.textContent = 'Automatic copying is unavailable. Select and copy the enquiry below.';
      }
    });
  }
  // Native POST remains available on browsers without this enhancement.
  if (!window.fetch || !window.FormData || !window.AbortController) return;
  var pending = false;
  var status = document.getElementById('form-status');
  var button = form.querySelector('button[type="submit"]');
  var errorSummary = document.getElementById('form-errors');
  function clearFieldError(field) {
    field.removeAttribute('aria-invalid');
    var message = document.getElementById(field.id + '-error');
    if (message) { message.textContent = ''; message.hidden = true; }
    Array.from(errorSummary.children).forEach(function (link) {
      if (link.getAttribute('href') === '#' + field.id) link.remove();
    });
  }
  function clearErrors() {
    fields.querySelectorAll('input,select,textarea').forEach(clearFieldError);
    errorSummary.replaceChildren();
    errorSummary.hidden = true;
  }
  form.querySelector('[data-new-enquiry]').addEventListener('click', function () {
    form.reset();
    acceptedText = '';
    receipt.hidden = true;
    document.getElementById('receipt-text').textContent = '';
    fields.hidden = false;
    fields.disabled = false;
    button.hidden = false;
    copy.textContent = 'Copy enquiry for email';
    copyStatus.textContent = '';
    document.getElementById('copy-fallback').hidden = true;
    document.getElementById('enquiry-copy').value = '';
    status.textContent = '';
    status.className = 'form-status';
    clearErrors();
    form.elements.name.focus();
  });
  form.addEventListener('input', function (event) {
    clearFieldError(event.target);
    if (!fields.querySelector('[aria-invalid="true"]')) { errorSummary.hidden = true; errorSummary.replaceChildren(); }
    copyStatus.textContent = '';
  });
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (pending || acceptedText || !form.reportValidity()) return;
    if (form.elements._gotcha.value) return;
    // Capture before disabling the fieldset: disabled fields are omitted by FormData.
    var payload = new FormData(form);
    var submittedText = enquiryText();
    var firstInvalid = null;
    pending = true;
    fields.disabled = true;
    button.disabled = true;
    if (copy) copy.disabled = true;
    clearErrors();
    button.textContent = 'Sending enquiry...';
    form.setAttribute('aria-busy', 'true');
    status.textContent = 'Sending your enquiry.';
    status.className = 'form-status';
    var controller = new AbortController();
    var timer = window.setTimeout(function () { controller.abort(); }, 15000);
    var failureMessage = 'We could not confirm delivery. Your details are still here. Copy your enquiry below and email it, or try again later.';
    try {
      var response = await fetch(form.action, {method:'POST', body:payload, headers:{Accept:'application/json'}, signal:controller.signal});
      var data = await response.json().catch(function () { return null; });
      if (response.status === 429) failureMessage = 'The enquiry service is temporarily limiting submissions. Your details are still here. Copy your enquiry below and email it, or try again later.';
      else if (response.status === 422) {
        failureMessage = 'The enquiry service could not accept these details. Check your entries, or copy the enquiry below and email it directly.';
        if (data && Array.isArray(data.errors)) data.errors.forEach(function (error) {
          var messages = {name:'Enter your name.',email:'Check your email address, then try again.',company:'Check the company or organisation name.',event:'Choose an event type or leave it open.',date:'Check the date or leave it open.',venue:'Check the venue or town.',guests:'Enter a guest count of 1 to 100000 or leave it open.',message:'Keep the event details within 5000 characters.'};
          if (typeof error.field !== 'string' || !Object.prototype.hasOwnProperty.call(messages, error.field)) return;
          var field = form.elements[error.field];
          if (field.getAttribute('aria-invalid') === 'true') return;
          field.setAttribute('aria-invalid','true');
          var message = document.getElementById(field.id + '-error');
          message.textContent = messages[error.field]; message.hidden = false;
          if (!firstInvalid) firstInvalid = field;
          var item = document.createElement('a');
          item.href = '#' + field.id; item.textContent = messages[error.field];
          item.addEventListener('click', function (e) { e.preventDefault(); field.focus(); });
          errorSummary.appendChild(item); errorSummary.hidden = false;
        });
      }
      if (!response.ok || !data || data.ok !== true) throw new Error('Submission not confirmed');
      acceptedText = submittedText;
      fields.hidden = true;
      button.hidden = true;
      document.getElementById('receipt-context').textContent = 'Accepted by the enquiry service. Keep this copy for your records. This is not a booking confirmation.';
      document.getElementById('receipt-text').textContent = acceptedText;
      receipt.hidden = false;
      copy.textContent = 'Copy submitted enquiry';
      document.getElementById('copy-fallback').hidden = true;
      document.getElementById('enquiry-copy').value = '';
      copyStatus.textContent = '';
      status.textContent = 'Thank you. Your enquiry has been accepted by the enquiry service. Derek can reply using the email address you provided. Your date is not reserved until the booking is confirmed.';
      status.classList.add('success');
    } catch (error) {
      if (error.name === 'AbortError') failureMessage = 'The enquiry service took too long to respond. Delivery is unconfirmed. Your details are still here. Copy your enquiry below and email it directly.';
      status.textContent = failureMessage;
      status.classList.add('error');
    } finally {
      window.clearTimeout(timer);
      pending = false;
      fields.disabled = Boolean(acceptedText);
      button.disabled = false;
      if (copy) copy.disabled = false;
      button.textContent = 'Send enquiry';
      form.removeAttribute('aria-busy');
      if (firstInvalid) firstInvalid.focus();
      else status.focus();
    }
  });
})();
