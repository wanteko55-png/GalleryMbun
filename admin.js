// === Navigasi antar tab ===
document.querySelectorAll('nav ul li a').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = e.target.getAttribute('href').substring(1);
    document.querySelectorAll('.admin-section').forEach(sec => sec.classList.add('hidden'));
    document.getElementById(target).classList.remove('hidden');
    document.querySelectorAll('nav ul li a').forEach(a => a.classList.remove('active'));
    e.target.classList.add('active');
  });
});

// === Modal Produk ===
const modal = document.getElementById('modalProduk');
document.getElementById('btnTambahProduk').onclick = () => modal.classList.remove('hidden');
document.getElementById('closeModal').onclick = () => modal.classList.add('hidden');

// === Simulasi data dashboard ===
document.getElementById('stat-produk').innerText = 12;
document.getElementById('stat-order').innerText = 5;
document.getElementById('stat-user').innerText = 32;

// === Simulasi tambah produk ===
document.getElementById('formProduk').addEventListener('submit', e => {
  e.preventDefault();
  alert("✅ Produk baru berhasil ditambahkan!");
  modal.classList.add('hidden');
});
