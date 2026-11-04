/* Opera Lux Events: accessible navigation, opt-in video and enquiry handling. */
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
    nav.classList.add('has-menu');
    menu.addEventListener('click', function () {
      var open = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('menu-open', open);
    });
    nav.querySelectorAll('a').forEach(function (link) { link.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
        closeMenu(); menu.focus();
      }
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 1000) closeMenu(); });
    function onScroll() { nav.classList.toggle('scrolled', window.scrollY > 24); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  document.querySelectorAll('[data-youtube]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(link.dataset.youtube) + '?autoplay=1';
      iframe.title = 'Derek Rue: featured live performance on YouTube';
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.className = 'activated-player';
      link.replaceWith(iframe);
      iframe.focus();
    });
  });

  var form = document.querySelector('.contact-form');
  if (!form) return;
  var date = document.getElementById('date');
  var today = new Date();
  if (date) date.min = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  if (!window.fetch || !window.FormData || !window.AbortController) return;
  var pending = false;
  var status = document.getElementById('form-status');
  var button = form.querySelector('button[type="submit"]');
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (pending || !form.reportValidity()) return;
    if (form.elements._gotcha.value) return;
    pending = true;
    button.disabled = true;
    button.textContent = 'Sending enquiry...';
    form.setAttribute('aria-busy', 'true');
    status.textContent = 'Sending your enquiry.';
    status.className = 'form-status';
    var controller = new AbortController();
    var timer = window.setTimeout(function () { controller.abort(); }, 15000);
    try {
      var response = await fetch(form.action, {
        method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' }, signal: controller.signal
      });
      var data = await response.json().catch(function () { return null; });
      if (!response.ok || !data || data.ok !== true) throw new Error('Submission not confirmed');
      form.reset();
      status.textContent = 'Thank you. Your enquiry has been submitted. Derek will reply to the email address you provided. Your date is not reserved until the booking is confirmed.';
      status.classList.add('success');
    } catch (error) {
      status.textContent = 'We could not confirm delivery. Your details are still here. Please try again later or email agency@operaluxevents.com directly.';
      status.classList.add('error');
    } finally {
      window.clearTimeout(timer);
      pending = false;
      button.disabled = false;
      button.textContent = 'Send enquiry';
      form.removeAttribute('aria-busy');
      status.focus();
    }
  });
})();
