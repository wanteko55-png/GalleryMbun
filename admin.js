/******************************************************
 * admin.js (FINAL)
 * Versi: Gallery Mbun Admin Panel v1.0
 * Terhubung ke Google Sheets via API_URL (config.js)
 ******************************************************/

// === Helper Query Selector ===
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

/* =====================================================
   KONSTANTA & KEY LOCALSTORAGE
===================================================== */
const ADMIN_KEY = 'gm_admin_auth';

/* =====================================================
   AUTH HANDLING
===================================================== */
function isLoggedIn() {
  return !!localStorage.getItem(ADMIN_KEY);
}
function getAdminEmail() {
  try { return JSON.parse(localStorage.getItem(ADMIN_KEY)).email; } 
  catch(e){ return ''; }
}

/* =====================================================
   DOM REFERENCES
===================================================== */
const modalLogin = $('#modalLogin');
const modalProduct = $('#modalProduct');
const btnOpenLogin = $('#btnOpenLogin');
const btnCloseLogin = $('#btnCloseLogin');
const btnLogout = $('#btnLogout');
const adminLogged = $('#admin-logged');
const adminEmailLabel = $('#adminEmailLabel');

/* =====================================================
   INIT
===================================================== */
document.addEventListener('DOMContentLoaded', () => {
  setupAuthUI();

  // Navigasi antar panel
  $$('.admin-link').forEach(a => a.addEventListener('click', onNavClick));

  // Event tombol
  $('#btnAddProduct')?.addEventListener('click', openAddProduct);
  $('#btnReloadProducts')?.addEventListener('click', loadProducts);
  btnOpenLogin?.addEventListener('click', () => showModal(modalLogin));
  btnCloseLogin?.addEventListener('click', () => closeModal(modalLogin));
  $('#formLogin')?.addEventListener('submit', handleLogin);
  $('#btnCloseModal')?.addEventListener('click', () => closeModal(modalProduct));
  $('#formProduct')?.addEventListener('submit', handleSaveProduct);

  // Muat produk awal
  loadProducts();

  btnLogout?.addEventListener('click', () => {
    localStorage.removeItem(ADMIN_KEY);
    setupAuthUI();
  });
});

/* =====================================================
   AUTH UI
===================================================== */
function setupAuthUI(){
  if(isLoggedIn()){
    adminLogged.style.display = 'flex';
    $('#admin-login-area').style.display = 'none';
    adminEmailLabel.textContent = getAdminEmail();
  } else {
    $('#admin-login-area').style.display = 'flex';
    $('#admin-logged').style.display = 'none';
  }
}

function showModal(modal){
  if(!modal) return;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden','false');
  const firstInput = modal.querySelector('input,textarea,select,button');
  if(firstInput) firstInput.focus();
}
function closeModal(modal){
  if(!modal) return;
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden','true');
}

/* =====================================================
   LOGIN ADMIN (STATIC)
===================================================== */
const DEFAULT_ADMIN = { email: 'admin@gallerymbun.com', password: 'gallery123' };

function handleLogin(e){
  e.preventDefault();
  const email = $('#loginEmail').value.trim();
  const pass = $('#loginPass').value.trim();

  if(email === DEFAULT_ADMIN.email && pass === DEFAULT_ADMIN.password){
    localStorage.setItem(ADMIN_KEY, JSON.stringify({ email }));
    $('#loginStatus').textContent = '';
    closeModal(modalLogin);
    setupAuthUI();
  } else {
    $('#loginStatus').textContent = 'Email atau password salah.';
    setTimeout(()=>$('#loginStatus').textContent='', 2500);
  }
}

/* =====================================================
   NAVIGATION ANTAR PANEL
===================================================== */
function onNavClick(e){
  e.preventDefault();
  const t = e.currentTarget;
  const target = t.dataset.target;
  $$('.panel').forEach(p => p.classList.add('hidden'));
  $(`#${target}`).classList.remove('hidden');
  $$('.admin-link').forEach(a=>a.classList.remove('active'));
  t.classList.add('active');
}

/* =====================================================
   CRUD PRODUK (GET, ADD, UPDATE, DELETE)
===================================================== */

// === GET PRODUCTS ===
async function loadProducts(){
  setDashboardStatus('Memuat data produk...');
  try {
    const res = await fetch(`${API_URL}?action=products`);
    const json = await res.json();

    if(json.success && json.products){
      renderProducts(json.products);
      updateStats(json.products.length);
      setDashboardStatus('');
    } else {
      renderProducts([]);
      updateStats(0);
      setDashboardStatus('Data produk kosong atau gagal dimuat.');
    }

  } catch(err){
    console.error(err);
    setDashboardStatus('Koneksi ke Google Sheets gagal!');
  }
}

// === RENDER TABEL PRODUK ===
function renderProducts(items){
  const tbody = $('#tableProducts tbody');
  tbody.innerHTML = '';

  if(!Array.isArray(items) || items.length === 0){
    tbody.innerHTML = '<tr><td colspan="7">Belum ada produk</td></tr>';
    return;
  }

  items.forEach((it, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(it.ProductName||'')}</td>
      <td>${escapeHtml(it.Description||'')}</td>
      <td>${escapeHtml(it.Price||'')}</td>
      <td>${escapeHtml(it.Category||'')}</td>
      <td>${escapeHtml(it.Type||'')}</td>
      <td>${escapeHtml(it.Status||'')}</td>
      <td>
        <button class="btn small" data-idx="${idx}" data-action="edit">Edit</button>
        <button class="btn small cancel" data-idx="${idx}" data-action="delete">Hapus</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  $$('#tableProducts button').forEach(b => {
    b.addEventListener('click', ev => {
      const action = ev.currentTarget.dataset.action;
      const idx = Number(ev.currentTarget.dataset.idx);
      if(action === 'edit') openEditProduct(items[idx]);
      if(action === 'delete') deleteProduct(items[idx]);
    });
  });
}

// === ESCAPE HTML ===
function escapeHtml(s){
  return (s+'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#039;"}[c]));
}

// === TAMBAH PRODUK ===
function openAddProduct(){
  $('#modalTitle').textContent = 'Tambah Produk';
  $('#prodId').value = '';
  $('#prodName').value = '';
  $('#prodDesc').value = '';
  $('#prodPrice').value = '';
  $('#prodCategory').value = '';
  $('#prodType').value = 'Digital';
  $('#prodStatus').value = 'Active';
  $('#productStatus').textContent = '';
  showModal(modalProduct);
}

// === EDIT PRODUK ===
function openEditProduct(product){
  $('#modalTitle').textContent = 'Edit Produk';
  $('#prodId').value = product.ID || '';
  $('#prodName').value = product.ProductName || '';
  $('#prodDesc').value = product.Description || '';
  $('#prodPrice').value = product.Price || '';
  $('#prodCategory').value = product.Category || '';
  $('#prodType').value = product.Type || 'Digital';
  $('#prodStatus').value = product.Status || 'Active';
  $('#productStatus').textContent = '';
  showModal(modalProduct);
}

// === SIMPAN PRODUK (ADD/UPDATE) ===
async function handleSaveProduct(e){
  e.preventDefault();
  const id = $('#prodId').value;
  const name = $('#prodName').value.trim();
  const desc = $('#prodDesc').value.trim();
  const price = $('#prodPrice').value.trim();
  const category = $('#prodCategory').value.trim();
  const type = $('#prodType').value;
  const status = $('#prodStatus').value;

  if(!name || !desc || !price || !category){
    $('#productStatus').textContent = 'Semua field wajib diisi!';
    setTimeout(()=>$('#productStatus').textContent='', 2000);
    return;
  }

  const data = {
    ID: id,
    ProductName: name,
    Description: desc,
    Price: price,
    Category: category,
    Type: type,
    Status: status
  };

  try {
    const action = id ? 'updateProduct' : 'addProduct';
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ action, product: data })
    });
    const json = await res.json();

    if(json.success){
      closeModal(modalProduct);
      loadProducts();
    } else {
      $('#productStatus').textContent = json.message || 'Gagal menyimpan produk.';
    }

  } catch(err){
    $('#productStatus').textContent = 'Koneksi gagal ke Google Sheets!';
  }
}

// === HAPUS PRODUK ===
async function deleteProduct(product){
  if(!confirm(`Hapus produk "${product.ProductName}"?`)) return;
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ action:'deleteProduct', id: product.ID })
    });
    const json = await res.json();

    if(json.success){
      loadProducts();
    } else {
      alert(json.message || 'Gagal menghapus produk.');
    }
  } catch(err){
    alert('Koneksi gagal ke Google Sheets!');
  }
}

/* =====================================================
   DASHBOARD STATUS
===================================================== */
function setDashboardStatus(msg) {
  const el = document.getElementById('dashboardStatus');
  if (el) el.textContent = msg || '';
}
function updateStats(total) {
  const el = document.getElementById('totalProducts');
  if (el) el.textContent = total;
}
