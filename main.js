/* Opera Lux — stage motion. Hand-rolled, no libraries.
   Respects prefers-reduced-motion; degrades to static content. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Nav: solidify on scroll */
  var nav = document.querySelector('nav');
  function onScroll() {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 24);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (reduced) return;

  /* Scroll reveal */
  var revealSelectors = [
    '.format-card', '.faq-card', '.training-card', '.voice-card', '.t-card',
    '.press-card', '.rep-item', '.detail-item', '.stat-item', '.now-item',
    '.photo-slot', '.video-slot', '.venue-slot', '.song-grid', '.cat-header',
    '.about-photo', '.about-text', '.bio-photo', '.bio-text', '.now-photo',
    '.duo-accent', '.duo-text', '.season', '.featured-inner',
    '.statement-main', '.statement-sub', '.contact-left', '.contact-form',
    '.cta-inner', '.insta-inner', '.coming-soon-block'
  ].join(',');

  var items = Array.prototype.slice.call(document.querySelectorAll(revealSelectors));
  if ('IntersectionObserver' in window && items.length) {
    items.forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = (i % 4) * 70 + 'ms';
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* Gentle 3D tilt on cards (fine pointers only) */
  if (window.matchMedia('(pointer: fine)').matches) {
    var tiltSelectors = '.format-card,.faq-card,.training-card,.voice-card,.t-card,.press-card,.rep-item,.detail-item,.stat-item';
    Array.prototype.slice.call(document.querySelectorAll(tiltSelectors)).forEach(function (card) {
      card.classList.add('tiltable');
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'perspective(900px) rotateX(' + (-py * 5) + 'deg) rotateY(' + (px * 6) + 'deg) translateY(-4px)';
      });
      card.addEventListener('pointerleave', function () {
        card.style.transform = '';
      });
    });
  }
})();
