/* ============================================================
   admin.js — Gallery Mbun Admin Panel (sinkron dengan struktur GitHub)
   Versi: 2025-10-06
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  setupSidebarNavigation();
  setupAdminButtons();
  loadDashboard();
  loadProduk();
});

/* ========== SELECTOR UTIL ========== */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* ========== DATA LOCAL STORAGE ========== */
const STORAGE_PRODUCTS = "gm_products";
const STORAGE_USER = "gm_admin";

/* ============================================================
   SIDEBAR NAVIGATION
============================================================ */
function setupSidebarNavigation() {
  const items = $$(".sidebar-nav li");
  items.forEach((li) => {
    li.addEventListener("click", () => {
      items.forEach((el) => el.classList.remove("active"));
      li.classList.add("active");
      const section = li.dataset.section;
      showSection(section);
    });
  });
}

function showSection(sectionId) {
  $$(".panel-section").forEach((s) => s.classList.remove("active"));
  const target = $("#" + sectionId);
  if (target) target.classList.add("active");

  const title = sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
  $("#sectionTitle").textContent = `Halaman ${title}`;
}

/* ============================================================
   ADMIN BUTTONS (refresh, tambah, logout)
============================================================ */
function setupAdminButtons() {
  const btnRefresh = $("#refreshBtn");
  const btnAdd = $("#addNewBtn");
  const btnLogout = $("#logoutBtn");

  if (btnRefresh) btnRefresh.addEventListener("click", loadProduk);
  if (btnAdd) btnAdd.addEventListener("click", openModalTambah);
  if (btnLogout) btnLogout.addEventListener("click", handleLogout);

  const form = $("#formTambahProduk");
  if (form) form.addEventListener("submit", simpanProduk);
}

/* ============================================================
   DASHBOARD
============================================================ */
function loadDashboard() {
  const dataProduk = JSON.parse(localStorage.getItem(STORAGE_PRODUCTS) || "[]");
  $("#totalProduk").textContent = dataProduk.length;
  $("#totalPesanan").textContent = Math.floor(Math.random() * 12);
  $("#totalPengguna").textContent = Math.floor(Math.random() * 40);
}

/* ============================================================
   PRODUK CRUD
============================================================ */
function loadProduk() {
  const dataProduk = JSON.parse(localStorage.getItem(STORAGE_PRODUCTS) || "[]");
  const tbody = $("#produkList");
  tbody.innerHTML = "";

  if (!dataProduk.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Belum ada data</td></tr>`;
    return;
  }

  dataProduk.forEach((p, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${p.nama}</td>
      <td>${p.kategori || "-"}</td>
      <td>Rp ${p.harga}</td>
      <td>
        <button class="btn small" onclick="editProduk(${i})">✏️</button>
        <button class="btn small cancel" onclick="hapusProduk(${i})">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function simpanProduk(e) {
  e.preventDefault();
  const nama = $("#namaProduk").value.trim();
  const kategori = $("#kategoriProduk").value.trim();
  const harga = $("#hargaProduk").value.trim();

  if (!nama || !harga) return alert("Nama dan harga wajib diisi!");

  const arr = JSON.parse(localStorage.getItem(STORAGE_PRODUCTS) || "[]");
  arr.push({ nama, kategori, harga });
  localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(arr));

  loadProduk();
  closeModal();
  notify("Produk berhasil ditambahkan ✅");
}

function editProduk(i) {
  const arr = JSON.parse(localStorage.getItem(STORAGE_PRODUCTS) || "[]");
  const p = arr[i];
  if (!p) return;

  $("#namaProduk").value = p.nama;
  $("#kategoriProduk").value = p.kategori;
  $("#hargaProduk").value = p.harga;

  openModalTambah(true);
  $("#formTambahProduk").onsubmit = (e) => {
    e.preventDefault();
    arr[i] = {
      nama: $("#namaProduk").value.trim(),
      kategori: $("#kategoriProduk").value.trim(),
      harga: $("#hargaProduk").value.trim(),
    };
    localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(arr));
    loadProduk();
    closeModal();
    notify("Perubahan disimpan ✅");
  };
}

function hapusProduk(i) {
  if (!confirm("Yakin ingin menghapus produk ini?")) return;
  const arr = JSON.parse(localStorage.getItem(STORAGE_PRODUCTS) || "[]");
  arr.splice(i, 1);
  localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(arr));
  loadProduk();
  notify("Produk dihapus ❌");
}

/* ============================================================
   MODAL PRODUK
============================================================ */
function openModalTambah(isEdit = false) {
  $("#modalTambah").classList.add("active");
  $("#modalTitle").textContent = isEdit ? "Edit Produk" : "Tambah Produk";
  $("#formTambahProduk").reset();
}

function closeModal() {
  $("#modalTambah").classList.remove("active");
}

/* ============================================================
   LOGOUT
============================================================ */
function handleLogout() {
  if (confirm("Keluar dari admin panel?")) {
    localStorage.removeItem(STORAGE_USER);
    window.location.href = "index.html";
  }
}

/* ============================================================
   NOTIFIKASI
============================================================ */
function notify(msg) {
  let n = document.createElement("div");
  n.className = "notif";
  n.textContent = msg;
  document.body.appendChild(n);
  setTimeout(() => n.classList.add("show"), 50);
  setTimeout(() => {
    n.classList.remove("show");
    setTimeout(() => n.remove(), 300);
  }, 2200);
}
