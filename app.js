// Fungsi untuk ambil data produk dari Google Apps Script
async function loadProduk() {
  try {
    const res = await fetch(API_URL + "?action=getProduk");
    const data = await res.json();

    const container = document.getElementById("produkList");
    container.innerHTML = "";

    if (data && data.length > 0) {
      data.forEach(item => {
        const card = document.createElement("div");
        card.className = "produk-card";
        card.innerHTML = `
          <img src="${item.gambar}" alt="${item.nama}" />
          <h3>${item.nama}</h3>
          <p>${item.deskripsi}</p>
          <p class="harga">Rp ${item.harga}</p>
          <button class="btn-secondary">Beli Sekarang</button>
        `;
        container.appendChild(card);
      });
    } else {
      container.innerHTML = "<p>Belum ada produk tersedia.</p>";
    }

  } catch (err) {
    console.error("Gagal memuat produk:", err);
  }
}

// Jalankan saat halaman dimuat
document.addEventListener("DOMContentLoaded", loadProduk);
