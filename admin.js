// admin.js - Final Terhubung Google Sheets API
const API_URL = "PASTE_URL_WEBAPP_MU_DI_SINI"; // ← Ganti ini

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

const ADMIN_KEY = "gm_admin_auth";

/* =============== INIT =============== */
document.addEventListener("DOMContentLoaded", () => {
  setupAuthUI();
  $("#formLogin").addEventListener("submit", handleLogin);
  $("#btnLogout").addEventListener("click", handleLogout);
  $("#btnAddProduct").addEventListener("click", openAddProduct);
  $("#btnReloadProducts").addEventListener("click", loadProducts);
  $("#formProduct").addEventListener("submit", handleSaveProduct);
  $("#btnCloseModal").addEventListener("click", () => closeModal($("#modalProduct")));

  if (isLoggedIn()) loadProducts();
});

/* =============== AUTH =============== */
function isLoggedIn() {
  return !!localStorage.getItem(ADMIN_KEY);
}
function getAdminEmail() {
  try { return JSON.parse(localStorage.getItem(ADMIN_KEY)).email; } catch { return ""; }
}

function setupAuthUI() {
  if (isLoggedIn()) {
    $("#admin-login-area").style.display = "none";
    $("#admin-logged").style.display = "flex";
    $("#adminEmailLabel").textContent = getAdminEmail();
  } else {
    $("#admin-login-area").style.display = "flex";
    $("#admin-logged").style.display = "none";
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = $("#loginEmail").value.trim();
  const password = $("#loginPass").value.trim();

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verifyAdminLogin", email, password })
    });
    const json = await res.json();
    if (json.success) {
      localStorage.setItem(ADMIN_KEY, JSON.stringify({ email: json.email }));
      setupAuthUI();
      loadProducts();
    } else {
      $("#loginStatus").textContent = json.message;
      setTimeout(() => $("#loginStatus").textContent = "", 3000);
    }
  } catch (err) {
    $("#loginStatus").textContent = "Koneksi gagal ke server!";
  }
}

function handleLogout() {
  localStorage.removeItem(ADMIN_KEY);
  setupAuthUI();
}

/* =============== MODAL =============== */
function showModal(el) { el.classList.remove("hidden"); }
function closeModal(el) { el.classList.add("hidden"); }

/* =============== CRUD PRODUK =============== */
async function loadProducts() {
  try {
    const res = await fetch(`${API_URL}?action=getProducts`);
    const json = await res.json();
    if (json.success) {
      renderProducts(json.data);
    } else {
      setDashboardStatus(json.message);
    }
  } catch {
    setDashboardStatus("Gagal memuat data produk");
  }
}

function renderProducts(items) {
  const tbody = $("#tableProducts tbody");
  tbody.innerHTML = "";
  items.forEach((it, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${it.ID || i + 1}</td>
      <td>${it.ProductName || ""}</td>
      <td>${it.Description || ""}</td>
      <td>${it.Price || ""}</td>
      <td>${it.Category || ""}</td>
      <td>${it.Type || ""}</td>
      <td>${it.Status || ""}</td>
      <td>
        <button class="btn small" onclick="openEditProduct(${encodeURIComponent(JSON.stringify(it))})">Edit</button>
        <button class="btn small cancel" onclick="deleteProduct('${it.ID}')">Hapus</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function openAddProduct() {
  $("#modalTitle").textContent = "Tambah Produk";
  $("#prodId").value = "";
  $("#formProduct").reset();
  $("#productStatus").textContent = "";
  showModal($("#modalProduct"));
}

function openEditProduct(it) {
  const p = typeof it === "string" ? JSON.parse(decodeURIComponent(it)) : it;
  $("#modalTitle").textContent = "Edit Produk";
  $("#prodId").value = p.ID || "";
  $("#prodName").value = p.ProductName || "";
  $("#prodDesc").value = p.Description || "";
  $("#prodPrice").value = p.Price || "";
  $("#prodCategory").value = p.Category || "";
  $("#prodType").value = p.Type || "Digital";
  $("#prodStatus").value = p.Status || "Active";
  $("#productStatus").textContent = "";
  showModal($("#modalProduct"));
}

async function handleSaveProduct(e) {
  e.preventDefault();
  const prod = {
    ID: $("#prodId").value,
    ProductName: $("#prodName").value.trim(),
    Description: $("#prodDesc").value.trim(),
    Price: $("#prodPrice").value.trim(),
    Category: $("#prodCategory").value.trim(),
    Type: $("#prodType").value,
    Status: $("#prodStatus").value
  };

  if (!prod.ProductName || !prod.Description || !prod.Price) {
    $("#productStatus").textContent = "Semua field wajib diisi!";
    return;
  }

  try {
    const action = prod.ID ? "updateProduct" : "addProduct";
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, product: prod })
    });
    const json = await res.json();
    if (json.success) {
      closeModal($("#modalProduct"));
      loadProducts();
    } else {
      $("#productStatus").textContent = json.message;
    }
  } catch {
    $("#productStatus").textContent = "Gagal menyimpan ke Google Sheet!";
  }
}

async function deleteProduct(id) {
  if (!confirm("Yakin hapus produk ini?")) return;
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteProduct", id })
    });
    const json = await res.json();
    if (json.success) loadProducts();
    else alert(json.message);
  } catch {
    alert("Koneksi gagal!");
  }
}

/* =============== DASHBOARD =============== */
function setDashboardStatus(msg) {
  const el = $("#dashboardStatus");
  if (el) el.textContent = msg;
}
