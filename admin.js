// admin.js -- CRUD Produk Google Sheet, validasi field wajib, feedback koneksi

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

const ADMIN_KEY = 'gm_admin_auth';
const ADMIN_DATA_KEY = 'gm_products_local';

/* ---------- AUTH ---------- */
function isLoggedIn() {
  return !!localStorage.getItem(ADMIN_KEY);
}
function getAdminEmail() {
  try { return JSON.parse(localStorage.getItem(ADMIN_KEY)).email; } catch(e){ return ''; }
}

/* ---------- UI refs ---------- */
const modalLogin = $('#modalLogin');
const modalProduct = $('#modalProduct');
const btnOpenLogin = $('#btnOpenLogin');
const btnCloseLogin = $('#btnCloseLogin');
const btnLogout = $('#btnLogout');
const adminLogged = $('#admin-logged');
const adminEmailLabel = $('#adminEmailLabel');

/* ---------- INIT ---------- */
document.addEventListener('DOMContentLoaded', () => {
  setupAuthUI();
  $$('.admin-link').forEach(a => a.addEventListener('click', onNavClick));
  $('#btnAddProduct').addEventListener('click', openAddProduct);
  $('#btnReloadProducts').addEventListener('click', loadProducts);
  btnOpenLogin.addEventListener('click', () => showModal(modalLogin));
  btnCloseLogin.addEventListener('click', () => closeModal(modalLogin));
  $('#formLogin').addEventListener('submit', handleLogin);
  $('#btnCloseModal').addEventListener('click', () => closeModal(modalProduct));
  $('#formProduct').addEventListener('submit', handleSaveProduct);

  // Sederhanakan: loadProducts saat awal, cek koneksi
  loadProducts();

  btnLogout.addEventListener('click', () => {
    localStorage.removeItem(ADMIN_KEY);
    setupAuthUI();
  });
});

/* ---------- AUTH UI ---------- */
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
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden','false');
  const firstInput = modal.querySelector('input,textarea,select,button');
  if(firstInput) firstInput.focus();
}
function closeModal(modal){
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden','true');
}

/* ---------- LOGIN (dummy) ---------- */
const DEFAULT_ADMIN = { email: 'admin@gallerymbun.com', password: 'gallery123' };

function handleLogin(e){
  e.preventDefault();
  const email = $('#loginEmail').value.trim();
  const pass = $('#loginPass').value.trim();
  if( (email===DEFAULT_ADMIN.email && pass===DEFAULT_ADMIN.password) ){
    localStorage.setItem(ADMIN_KEY, JSON.stringify({ email }));
    $('#loginStatus').textContent = '';
    closeModal(modalLogin);
    setupAuthUI();
  } else {
    $('#loginStatus').textContent = 'Email atau password salah.';
    setTimeout(() => { $('#loginStatus').textContent = ''; }, 2500);
  }
}

/* ---------- NAVIGATION ---------- */
function onNavClick(e){
  e.preventDefault();
  const t = e.currentTarget;
  const target = t.dataset.target;
  $$('.panel').forEach(p => p.classList.add('hidden'));
  $(`#${target}`).classList.remove('hidden');
  $$('.admin-link').forEach(a=>a.classList.remove('active'));
  t.classList.add('active');
}

/* ---------- PRODUCTS CRUD ---------- */
async function loadProducts(){
  setDashboardStatus('');
  try {
    if (typeof API_URL !== 'undefined' && API_URL){
      const res = await fetch(`${API_URL}?action=getProducts`);
      if(res.ok){
        const json = await res.json();
        const items = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
        renderProducts(items);
        updateStats(items.length);
        return;
      }
    }
    setDashboardStatus('Tidak bisa terhubung dengan Google Sheets.');
  } catch(err){
    setDashboardStatus('Koneksi ke Google Sheet gagal!');
  }
  renderProducts([]);
  updateStats(0);
}

function renderProducts(items){
  const tbody = $('#tableProducts tbody');
  tbody.innerHTML = '';
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
    b.addEventListener('click', (ev) => {
      const a = ev.currentTarget.dataset.action;
      const idx = Number(ev.currentTarget.dataset.idx);
      if(a==='edit') openEditProduct(items[idx], idx);
      if(a==='delete') deleteProduct(items[idx]);
    });
  });
}

function escapeHtml(s){
  return (s+'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#039;"}[c]));
}

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

function openEditProduct(product, idx){
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

async function handleSaveProduct(e){
  e.preventDefault();
  // Validasi wajib
  const id = $('#prodId').value;
  const name = $('#prodName').value.trim();
  const desc = $('#prodDesc').value.trim();
  const price = $('#prodPrice').value.trim();
  const category = $('#prodCategory').value.trim();
  const type = $('#prodType').value;
  const status = $('#prodStatus').value;
  if (!name || !desc || !price || !category || !type || !status) {
    $('#productStatus').textContent = 'Semua field wajib diisi!';
    setTimeout(()=>{$('#productStatus').textContent=''}, 2000);
    return;
  }
  $('#productStatus').textContent = '';

  // Data produk sesuai Sheet
  const data = {
    ID: id,
    ProductName: name,
    Description: desc,
    Price: price,
    Category: category,
    Type: type,
    Status: status
  };

  // Simpan ke Google Sheet
  try {
    let action = id ? 'updateProduct' : 'addProduct';
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ action, product: data })
    });
    if (res.ok) {
      closeModal(modalProduct);
      loadProducts();
    } else {
      $('#productStatus').textContent = 'Gagal menyimpan ke Google Sheets!';
    }
  } catch (e) {
    $('#productStatus').textContent = 'Koneksi gagal!';
  }
}

async function deleteProduct(product){
  if(!confirm('Hapus produk ini?')) return;
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ action: 'deleteProduct', id: product.ID })
    });
    if (res.ok) {
      loadProducts();
    } else {
      alert('Gagal hapus dari Google Sheets!');
    }
  } catch(e){
    alert('Koneksi gagal!');
  }
}

/* ---------- DASHBOARD STATUS ---------- */
function setDashboardStatus(msg) {
  const el = document.getElementById('dashboardStatus');
  if (el) el.textContent = msg || '';
}

/* ---------- (BANNER, CONTACT, ORDERS, SETTINGS: opsional, lanjutkan sesuai kebutuhan) ---------- */
/* Kamu dapat menambah fungsi loadOrders, loadContact, dsb sesuai script.js sebelumnya, tinggal digabungkan.
   Jika ingin CRUD full, pastikan endpoint API_URL mendukungnya.
*/
