/* admin.js
   Full admin interactions:
   - simple login (localStorage)
   - load products (API_URL -> GET ?action=getProducts) or fallback to assets/img/products.json
   - create/edit/delete product (POST to API_URL?action=... OR localStorage fallback)
   - update banner/logo (preview + store to localStorage or send to API)
   - update contact info (save to localStorage or API)
   - manage simple orders (demo)
*/

/* ---------- HELPERS ---------- */
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

/* ---------- AUTH ---------- */
const ADMIN_KEY = 'gm_admin_auth';
const ADMIN_DATA_KEY = 'gm_products_local';
const CONTACT_KEY = 'gm_contact_local';
const MEDIA_KEY = 'gm_media_local';

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
  // auth UI
  setupAuthUI();

  // navigation
  $$('.admin-link').forEach(a => a.addEventListener('click', onNavClick));

  // product buttons
  $('#btnAddProduct').addEventListener('click', openAddProduct);
  $('#btnReloadProducts').addEventListener('click', loadProducts);

  // modal login
  btnOpenLogin.addEventListener('click', () => showModal(modalLogin));
  $('#btnCloseLogin').addEventListener('click', () => closeModal(modalLogin));
  $('#formLogin').addEventListener('submit', handleLogin);

  // product modal handlers
  $('#btnCloseModal').addEventListener('click', () => closeModal(modalProduct));
  $('#formProduct').addEventListener('submit', handleSaveProduct);

  // media handlers
  $('#inputBanner').addEventListener('change', previewBanner);
  $('#inputLogo').addEventListener('change', previewLogo);
  $('#btnSaveMedia').addEventListener('click', saveMedia);

  // contact form
  $('#formContact').addEventListener('submit', saveContact);
  $('#btnResetContact').addEventListener('click', resetContactForm);

  // logout
  btnLogout.addEventListener('click', () => {
    localStorage.removeItem(ADMIN_KEY);
    setupAuthUI();
  });

  // initial loads
  loadProducts();
  loadOrders();
  loadContact();
  loadMediaPreview();
});

/* ---------- AUTH UI ---------- */
function setupAuthUI(){
  if(isLoggedIn()){
    adminLogged.style.display = 'flex';
    $('#admin-login-area').style.display = 'none';
    adminEmailLabel.textContent = getAdminEmail();
    $('#admin-logged').style.display = 'flex';
    $('#admin-login-area').style.display = 'none';
  } else {
    $('#admin-login-area').style.display = 'flex';
    $('#admin-logged').style.display = 'none';
  }
}

function showModal(modal){
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden','false');
}
function closeModal(modal){
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden','true');
}

/* ---------- LOGIN (dummy) ---------- */
// default admin creds (only for local demo). For production, integrate OAuth or Apps Script-backed auth.
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
  }
}

/* ---------- NAVIGATION ---------- */
function onNavClick(e){
  e.preventDefault();
  const t = e.currentTarget;
  const target = t.dataset.target;
  // hide all panels
  $$('.panel').forEach(p => p.classList.add('hidden'));
  $(`#${target}`).classList.remove('hidden');
  $$('.admin-link').forEach(a=>a.classList.remove('active'));
  t.classList.add('active');
}

/* ---------- PRODUCTS CRUD ---------- */
async function loadProducts(){
  // try API first
  try {
    if (typeof API_URL !== 'undefined' && API_URL){
      const res = await fetch(`${API_URL}?action=getProducts`);
      if(res.ok){
        const json = await res.json();
        // API expected to return array in json.data or json
        const items = json.data || json;
        if(Array.isArray(items)) {
          renderProducts(items);
          localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(items));
          updateStats(items.length);
          return;
        }
      }
    }
  } catch(err){
    console.warn('API loadProducts error (fallback to local):', err);
  }

  // fallback: try local products file or localStorage
  try {
    // try localStorage
    const cached = localStorage.getItem(ADMIN_DATA_KEY);
    if(cached){
      const parsed = JSON.parse(cached);
      renderProducts(parsed);
      updateStats(parsed.length);
      return;
    }

    // try static JSON (assets/img/products.json or assets/products.json)
    const fallbackPaths = ['assets/products.json','assets/img/products.json','assets/products/products.json'];
    for(const p of fallbackPaths){
      try{
        const r = await fetch(p);
        if(r.ok){
          const j = await r.json();
          const items = j.products || j;
          renderProducts(items);
          localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(items));
          updateStats(items.length);
          return;
        }
      } catch(e){}
    }
  } catch(e){
    console.error('Fallback loadProducts error', e);
  }

  // if still nothing
  renderProducts([]);
  updateStats(0);
}

function renderProducts(items){
  const tbody = $('#tableProducts tbody');
  tbody.innerHTML = '';
  items.forEach((it, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="width:140px"><img src="${it.image||'assets/img/placeholder.png'}" style="width:120px;height:80px;object-fit:cover;border-radius:6px" /></td>
      <td>${escapeHtml(it.name||'—')}</td>
      <td>${escapeHtml(it.description||'—')}</td>
      <td>${escapeHtml(it.price||'—')}</td>
      <td>${escapeHtml(it.status||'active')}</td>
      <td>
        <button class="btn small" data-idx="${idx}" data-action="edit">Edit</button>
        <button class="btn small cancel" data-idx="${idx}" data-action="delete">Hapus</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // attach event handlers
  $$('#tableProducts button').forEach(b => {
    b.addEventListener('click', (ev) => {
      const a = ev.currentTarget.dataset.action;
      const idx = Number(ev.currentTarget.dataset.idx);
      const productList = JSON.parse(localStorage.getItem(ADMIN_DATA_KEY) || '[]');
      if(a==='edit') openEditProduct(productList[idx], idx);
      if(a==='delete') deleteProduct(idx);
    });
  });
}

/* helper escape */
function escapeHtml(s){
  return (s+'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#039;"}[c]));
}

/* open add */
function openAddProduct(){
  $('#modalTitle').textContent = 'Tambah Produk';
  $('#prodId').value = '';
  $('#prodName').value = '';
  $('#prodDesc').value = '';
  $('#prodPrice').value = '';
  $('#prodStatus').value = 'active';
  $('#prodImage').value = '';
  showModal(modalProduct);
}

/* open edit */
function openEditProduct(product, idx){
  $('#modalTitle').textContent = 'Edit Produk';
  $('#prodId').value = idx; // index in local array
  $('#prodName').value = product.name || '';
  $('#prodDesc').value = product.description || '';
  $('#prodPrice').value = product.price || '';
  $('#prodStatus').value = product.status || 'active';
  $('#prodImage').value = '';
  showModal(modalProduct);
}

/* delete product */
function deleteProduct(idx){
  if(!confirm('Hapus produk ini?')) return;
  const arr = JSON.parse(localStorage.getItem(ADMIN_DATA_KEY) || '[]');
  if(idx>=0 && idx < arr.length){
    arr.splice(idx,1);
    localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(arr));
    // try sync to API
    trySyncProducts(arr);
    renderProducts(arr);
    updateStats(arr.length);
  }
}

/* save product (add/edit) */
async function handleSaveProduct(e){
  e.preventDefault();
  const idx = $('#prodId').value;
  const name = $('#prodName').value.trim();
  const desc = $('#prodDesc').value.trim();
  const price = $('#prodPrice').value.trim();
  const status = $('#prodStatus').value;
  const file = $('#prodImage').files[0];

  let arr = JSON.parse(localStorage.getItem(ADMIN_DATA_KEY) || '[]');

  // handle image file -> base64
  let imageUrl = '';
  if(file){
    imageUrl = await toBase64(file);
  }

  if(idx===''){ // add
    const obj = { name, description: desc, price, status, image: imageUrl || 'assets/img/placeholder.png' };
    arr.push(obj);
  } else { // edit
    const i = Number(idx);
    arr[i] = { ...(arr[i] || {}), name, description: desc, price, status, image: imageUrl || arr[i].image || 'assets/img/placeholder.png' };
  }

  localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(arr));
  trySyncProducts(arr);
  renderProducts(arr);
  updateStats(arr.length);
  closeModal(modalProduct);
}

/* convert file to base64 */
function toBase64(file){
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej('fail convert');
    r.readAsDataURL(file);
  });
}

/* try sync products to API if available */
async function trySyncProducts(arr){
  if(typeof API_URL === 'undefined' || !API_URL) return;
  try{
    await fetch(API_URL, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ action:'syncProducts', products: arr })
    });
    console.log('Synced to API');
  } catch(e){
    console.warn('Sync to API failed', e);
  }
}

/* ---------- MEDIA (banner/logo) ---------- */
function previewBanner(e){
  const f = e.target.files[0];
  if(!f) return;
  toBase64(f).then(b64 => { $('#currentBanner').src = b64; localStorage.setItem(MEDIA_KEY, JSON.stringify({ ...(JSON.parse(localStorage.getItem(MEDIA_KEY)||'{}')), banner:b64 })); });
}
function previewLogo(e){
  const f = e.target.files[0];
  if(!f) return;
  toBase64(f).then(b64 => { $('#currentLogo').src = b64; localStorage.setItem(MEDIA_KEY, JSON.stringify({ ...(JSON.parse(localStorage.getItem(MEDIA_KEY)||'{}')), logo:b64 })); });
}
function loadMediaPreview(){
  const m = JSON.parse(localStorage.getItem(MEDIA_KEY) || '{}');
  if(m.banner) $('#currentBanner').src = m.banner;
  if(m.logo) $('#currentLogo').src = m.logo;
}
async function saveMedia(){
  const m = JSON.parse(localStorage.getItem(MEDIA_KEY) || '{}');
  if(!m.banner && !m.logo){
    $('#mediaStatus').textContent = 'Tidak ada perubahan.';
    setTimeout(()=>$('#mediaStatus').textContent='',2000);
    return;
  }
  // try send to API
  if(typeof API_URL !== 'undefined' && API_URL){
    try{
      const res = await fetch(API_URL, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ action:'updateMedia', media: m })
      });
      if(res.ok){ $('#mediaStatus').textContent = 'Media tersimpan di server.'; setTimeout(()=>$('#mediaStatus').textContent='',2500); return; }
    } catch(e){ console.warn('saveMedia -> API fail', e); }
  }
  // fallback: persist in localStorage already done by preview
  $('#mediaStatus').textContent = 'Perubahan tersimpan lokal (belum diupload ke server).';
  setTimeout(()=>$('#mediaStatus').textContent='',3000);
}

/* ---------- CONTACT ---------- */
function loadContact(){
  const c = JSON.parse(localStorage.getItem(CONTACT_KEY) || '{}');
  $('#inpWA').value = c.wa || '';
  $('#inpEmail').value = c.email || '';
  $('#inpRek').value = c.rek || '';
  $('#inpDesc').value = c.desc || '';
}
async function saveContact(e){
  e.preventDefault();
  const data = { wa:$('#inpWA').value.trim(), email:$('#inpEmail').value.trim(), rek:$('#inpRek').value.trim(), desc:$('#inpDesc').value.trim() };
  // try API
  if(typeof API_URL !== 'undefined' && API_URL){
    try{
      const r = await fetch(API_URL, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'saveContact', contact: data }) });
      if(r.ok){ $('#contactStatus').textContent = 'Kontak tersimpan di server.'; setTimeout(()=>$('#contactStatus').textContent='',2500); localStorage.setItem(CONTACT_KEY, JSON.stringify(data)); return; }
    } catch(e){ console.warn('saveContact API fail', e); }
  }
  localStorage.setItem(CONTACT_KEY, JSON.stringify(data));
  $('#contactStatus').textContent = 'Kontak tersimpan lokal (belum diupload).';
  setTimeout(()=>$('#contactStatus').textContent='',2500);
}
function resetContactForm(){
  localStorage.removeItem(CONTACT_KEY);
  loadContact();
}

/* ---------- ORDERS (demo) ---------- */
function loadOrders(){
  // try API
  (async () => {
    try {
      if(typeof API_URL !== 'undefined' && API_URL){
        const r = await fetch(`${API_URL}?action=getOrders`);
        if(r.ok){
          const j = await r.json();
          const orders = j.data || j;
          renderOrders(orders);
          return;
        }
      }
    } catch(e){ console.warn('loadOrders API fail', e); }
    // fallback: demo data
    const demo = [
      { id:'ORD_001', user:'Siti', items:'Vas Keramik', total:'Rp185.000', status:'Pending' },
      { id:'ORD_002', user:'Asep', items:'Totebag', total:'Rp120.000', status:'Shipped' }
    ];
    renderOrders(demo);
  })();
}
function renderOrders(list){
  const tbody = $('#tableOrders tbody');
  tbody.innerHTML = '';
  list.forEach(o=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${o.id||o.OrderID||''}</td><td>${o.user||o.UserID||''}</td><td>${o.items||o.ProductID||''}</td><td>${o.total||o.TotalPrice||''}</td><td>${o.status||o.Status||''}</td>
      <td><button class="btn small" onclick="alert('Detail order: ${o.id||o.OrderID||''}')">Detail</button></td>`;
    tbody.appendChild(tr);
  });
}

/* ---------- STATS ---------- */
function updateStats(totalProducts=0){
  $('#statTotalProduk').textContent = totalProducts;
  // demo values
  $('#statOrders').textContent = 5;
  $('#statUsers').textContent = 42;
}

/* ---------- UTIL ---------- */
function toBase64(file){
  return new Promise((res, rej)=>{
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = () => rej('err');
    fr.readAsDataURL(file);
  });
}
