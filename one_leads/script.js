/**
 * OneLeads - Landing Page Script
 * Interacciones, Acordeón de FAQ, Precios y Acceso a la App CRM
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Acordeón de FAQ
  const faqQuestions = document.querySelectorAll('.faq-question');
  faqQuestions.forEach(q => {
    q.addEventListener('click', () => {
      const parent = q.parentElement;
      const isActive = parent.classList.contains('active');
      
      // Cerrar otros
      document.querySelectorAll('.faq-item').forEach(item => item.classList.remove('active'));
      
      if (!isActive) {
        parent.classList.add('active');
      }
    });
  });

  // 2. Animación de Scroll Suave para Enlaces Internos
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href !== '#') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  // 3. Simulación de movimiento de tarjetas en el mockup del Hero
  simulateHeroMockup();
});

function simulateHeroMockup() {
  const cards = document.querySelectorAll('.mock-card');
  if (!cards || cards.length === 0) return;

  let currentIdx = 0;
  setInterval(() => {
    cards.forEach(c => c.style.transform = 'scale(1)');
    const card = cards[currentIdx % cards.length];
    if (card) {
      card.style.transition = 'transform 0.4s ease';
      card.style.transform = 'scale(1.05)';
      setTimeout(() => {
        card.style.transform = 'scale(1)';
      }, 800);
    }
    currentIdx++;
  }, 2400);
}
