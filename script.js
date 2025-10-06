// === MENU RESPONSIF ===
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
navToggle.addEventListener('click', () => navMenu.classList.toggle('show'));

// === ANIMASI SCROLL ===
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('visible');
  });
}, { threshold: 0.2 });
document.querySelectorAll('.animate-fade, .animate-up, .animate-left, .animate-right')
  .forEach(el => observer.observe(el));

// === POPUP DETAIL PRODUK ===
const popup = document.getElementById('productPopup');
const closeBtn = popup.querySelector('.close');
document.querySelectorAll('.product-card').forEach(card => {
  card.addEventListener('click', () => {
    document.getElementById('popupTitle').textContent = card.dataset.title;
    document.getElementById('popupDesc').textContent = card.dataset.desc;
    document.getElementById('popupPrice').textContent = card.dataset.price;
    document.getElementById('popupImg').src = card.dataset.img;
    popup.classList.add('show');
  });
});
closeBtn.addEventListener('click', () => popup.classList.remove('show'));
window.addEventListener('click', e => { if (e.target === popup) popup.classList.remove('show'); });

// === CETAK KATALOG PDF ===
document.getElementById('downloadPDF').addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFont('helvetica', 'bold');
  doc.text('Katalog Produk Gallery Mbun', 20, 20);
  doc.setFont('helvetica', 'normal');
  let y = 40;
  document.querySelectorAll('.product-card').forEach(card => {
    doc.text(`${card.dataset.title} - ${card.dataset.price}`, 20, y);
    y += 10;
  });
  doc.save('Katalog-Gallery-Mbun.pdf');
});
