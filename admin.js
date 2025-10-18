// ===============================
// admin.js — versi final (Gallery Mbun Admin Panel)
// Koneksi penuh ke Google Sheets via Apps Script WebApp
// ===============================

// --- utilitas cepat ---
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

// --- kunci auth di localStorage ---
const ADMIN_KEY = 'gm_admin_auth';

/* =======================================================
   1. INISIALISASI
======================================================= */
document.addEventListener('DOMContentLoaded', () => {
  setupAuthUI();

  // tombol umum
  $('#btnOpenLogin')?.addEventListener('click', () => showModal('#modalLogin'));
  $('#btnCloseLogin')?.addEventListener('click', () => closeModal('#modalLogin'));
  $('#btnLogout')?.addEventListener('click', logoutAdmin);

  // navigasi
  $$('.admin-link').forEach(a => a.addEventListener('click', onNavClick));

  // produk
  $('#btnAddProduct')?.addEventListener('click', openAddProduct);
  $('#btnReloadProducts')?.addEventListener('click', loadProducts);
  $('#formProduct')?.addEventListener('submit', handleSaveProduct);
  $('#btnCloseModal')?.addEventListener('click', () => closeModal('#modalProduct'));

  // login
  $('#formLogin')?.addEventListener('submit', handleLogin);

  // muat data awal
  loadProducts();
});

/* =======================================================
   2. AUTENTIKASI ADMIN
======================================================= */
function isLoggedIn() {
  return !!localStorage.getItem(ADMIN_KEY);
}

function getAdminEmail() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_KEY)).email || '';
  } catch {
    return '';
  }
}

function setupAuthUI() {
  if (isLoggedIn()) {
    $('#admin-logged').style.display = 'flex';
    $('#admin-login-area').style.display = 'none';
    $('#adminEmailLabel').textContent = getAdminEmail();
  } else {
    $('#admin-logged').style.display = 'none';
    $('#admin-login-area').style.display = 'flex';
  }
}

function logoutAdmin() {
  localStorage.removeItem(ADMIN_KEY);
  setupAuthUI();
}

/* =======================================================
   3. LOGIN (TERHUBUNG KE CODE.GS)
======================================================= */
function handleLogin(e) {
  e.preventDefault();
  const email = $('#loginEmail').value.trim();
  const pass = $('#loginPass').value.trim();

  if (!email || !pass) {
    $('#loginStatus').textContent = 'Isi email & password!';
    return;
  }

  $('#loginStatus').textContent = 'Memeriksa...';

  google.script.run
    .withSuccessHandler((res) => {
      console.log('Respon login:', res);
      if (res.success) {
        localStorage.setItem(ADMIN_KEY, JSON.stringify({ email: res.email }));
        $('#loginStatus').textContent = '';
        closeModal('#modalLogin');
        setupAuthUI();
        loadProducts();
      } else {
        $('#loginStatus').textContent = res.message || 'Login gagal!';
      }
    })
    .withFailureHandler((err) => {
      console.error('Gagal terhubung ke Apps Script:', err);
      $('#loginStatus').textContent = 'Tidak dapat terhubung ke server.';
    })
    .verifikasiLoginAdmin(email, pass);
}

/* =======================================================
   4. NAVIGASI ANTAR PANEL
======================================================= */
function onNavClick(e) {
  e.preventDefault();
  const target = e.currentTarget.dataset.target;
  $$('.panel').forEach(p => p.classList.add('hidden'));
  $(`#${target}`).classList.remove('hidden');
  $$('.admin-link').forEach(a => a.classList.remove('active'));
  e.currentTarget.classList.add('active');
}

/* =======================================================
   5. PRODUK CRUD (TERHUBUNG KE CODE.GS)
======================================================= */
function loadProducts() {
  if (!isLoggedIn()) return;

  setDashboardStatus('Memuat data produk...');

  google.script.run
    .withSuccessHandler((data) => {
      renderProducts(data || []);
      updateStats(data.length);
      setDashboardStatus('');
    })
    .withFailureHandler(() => {
      setDashboardStatus('Gagal memuat data dari Google Sheets.');
    })
    .getProducts(); // fungsi di Code.gs
}

function renderProducts(items) {
  const tbody = $('#tableProducts tbody');
  tbody.innerHTML = '';
  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Belum ada data produk</td></tr>`;
    return;
  }

  items.forEach((it, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(it.ProductName || '')}</td>
      <td>${escapeHtml(it.Description || '')}</td>
      <td>${escapeHtml(it.Price || '')}</td>
      <td>${escapeHtml(it.Category || '')}</td>
      <td>${escapeHtml(it.Type || '')}</td>
      <td>${escapeHtml(it.Status || '')}</td>
      <td>
        <button class="btn small" data-idx="${idx}" data-action="edit">Edit</button>
        <button class="btn small cancel" data-idx="${idx}" data-action="delete">Hapus</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  $$('#tableProducts button').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      const idx = Number(ev.currentTarget.dataset.idx);
      const action = ev.currentTarget.dataset.action;
      if (action === 'edit') openEditProduct(items[idx]);
      if (action === 'delete') deleteProduct(items[idx]);
    });
  });
}

function openAddProduct() {
  $('#modalTitle').textContent = 'Tambah Produk';
  $('#prodId').value = '';
  $('#formProduct').reset();
  $('#productStatus').textContent = '';
  showModal('#modalProduct');
}

function openEditProduct(product) {
  $('#modalTitle').textContent = 'Edit Produk';
  $('#prodId').value = product.ID || '';
  $('#prodName').value = product.ProductName || '';
  $('#prodDesc').value = product.Description || '';
  $('#prodPrice').value = product.Price || '';
  $('#prodCategory').value = product.Category || '';
  $('#prodType').value = product.Type || 'Digital';
  $('#prodStatus').value = product.Status || 'Active';
  $('#productStatus').textContent = '';
  showModal('#modalProduct');
}

function handleSaveProduct(e) {
  e.preventDefault();

  const data = {
    ID: $('#prodId').value,
    ProductName: $('#prodName').value.trim(),
    Description: $('#prodDesc').value.trim(),
    Price: $('#prodPrice').value.trim(),
    Category: $('#prodCategory').value.trim(),
    Type: $('#prodType').value,
    Status: $('#prodStatus').value
  };

  // validasi
  if (!data.ProductName || !data.Description || !data.Price || !data.Category) {
    $('#productStatus').textContent = 'Semua field wajib diisi!';
    setTimeout(() => $('#productStatus').textContent = '', 2000);
    return;
  }

  $('#productStatus').textContent = 'Menyimpan...';

  const action = data.ID ? 'updateProduct' : 'addProduct';
  google.script.run
    .withSuccessHandler((ok) => {
      if (ok) {
        closeModal('#modalProduct');
        loadProducts();
      } else {
        $('#productStatus').textContent = 'Gagal menyimpan!';
      }
    })
    .withFailureHandler(() => {
      $('#productStatus').textContent = 'Tidak bisa konek server!';
    })[action](data); // panggil addProduct/updateProduct di Code.gs
}

function deleteProduct(product) {
  if (!confirm('Hapus produk ini?')) return;

  google.script.run
    .withSuccessHandler((ok) => {
      if (ok) loadProducts();
      else alert('Gagal hapus data.');
    })
    .withFailureHandler(() => alert('Tidak bisa konek server!'))
    .deleteProduct(product.ID);
}

/* =======================================================
   6. UTILITAS
======================================================= */
function showModal(sel) {
  const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
  el.classList.remove('hidden');
}
function closeModal(sel) {
  const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
  el.classList.add('hidden');
}
function escapeHtml(s) {
  return (s + '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[c]));
}
function setDashboardStatus(msg) {
  const el = document.getElementById('dashboardStatus');
  if (el) el.textContent = msg || '';
}
function updateStats(count) {
  const el = document.getElementById('totalProducts');
  if (el) el.textContent = count;
}
