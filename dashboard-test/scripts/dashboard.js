const API_URL = "https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnQxMm4hgLIOoXJUYtFmcLmnk-hc7qDytzHpiTYP_ThvDTEk65_bF9hNoAIK1CbxNPlqRcFWxPiBtWyiQZC18JG3-uNe-MCOREpXIL3FiuGjWcilCUL3mtqHF44hkcSE6xBZzHUsi3wESJelN4n29bqZMkDPdd4crJNgoRKgBD1HALQCZlZFiUfAV3f8wQxEARKG17IOorsyWMgG5QDgBpZbrYduMtDYYioX7isf74rTpppcR29-irDsbH3DPE-HJ_Q-dpw0pQhcWtErMHWRpkGJalHEFQ&lib=MKvojZlQyXVRxg8rMGjBYiozefzmNhkc7";

let allProker = [];

function renderCards(list) {
  const container = document.getElementById("proker-list");
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `<div class="empty-state">Tidak ada program kerja yang sesuai dengan filter.</div>`;
    return;
  }

  container.innerHTML = list.map(item => {
    const persen = parseInt(String(item.persentase).replace("%", ""), 10) || 0;
    const validLink = typeof item.tautan_public === "string" && item.tautan_public.startsWith("http");
    const barClass = item.status === "Terlaksana" ? "progress-bar" : "progress-bar is-active";

    return `
      <article class="proker-card">
        <div>
          <div class="proker-header">
            <span class="badge-bidang">${item.bidang}</span>
            <span class="badge-status" data-status="${item.status}">${item.status}</span>
          </div>
          <h3>${item.nama_kegiatan}</h3>
          <p>${item.deskripsi_singkat || ""}</p>
        </div>
        <div>
          <div class="progress-meta">
            <span>Kesiapan</span>
            <span>${persen}%</span>
          </div>
          <div class="progress-wrapper">
            <div class="${barClass}" style="width: ${persen}%"></div>
          </div>
          <div class="proker-footer">
            <span>Target: ${item.tanggal_target}</span>
            ${validLink ? `<a href="${item.tautan_public}" target="_blank" rel="noopener">Detail →</a>` : ""}
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function applyFilters() {
  const searchEl = document.getElementById("search-input");
  const bidangEl = document.getElementById("filter-bidang");
  const statusEl = document.getElementById("filter-status");

  const keyword = searchEl ? searchEl.value.toLowerCase().trim() : "";
  const selectedBidang = bidangEl ? bidangEl.value : "ALL";
  const selectedStatus = statusEl ? statusEl.value : "ALL";

  const filtered = allProker.filter(item => {
    const matchKeyword = !keyword ||
      (item.nama_kegiatan && item.nama_kegiatan.toLowerCase().includes(keyword)) ||
      (item.deskripsi_singkat && item.deskripsi_singkat.toLowerCase().includes(keyword));
    const matchBidang = selectedBidang === "ALL" || item.bidang === selectedBidang;
    const matchStatus = selectedStatus === "ALL" || item.status === selectedStatus;
    return matchKeyword && matchBidang && matchStatus;
  });

  renderCards(filtered);
}

async function loadProkerDashboard() {
  const container = document.getElementById("proker-list");

  try {
    const response = await fetch(API_URL);
    const result = await response.json();
    allProker = result.data || [];

    // Hitung ringkasan KPI otomatis
    const totalProker = allProker.length;
    const terlaksana = allProker.filter(p => p.status === "Terlaksana").length;
    const rataProgres = totalProker > 0
      ? Math.round(allProker.reduce((acc, p) => acc + (parseInt(String(p.persentase).replace("%", ""), 10) || 0), 0) / totalProker)
      : 0;

    // --- BAGIAN YANG DITAMBAHKAN (Aman jika salah satu kartu KPI dihapus) ---
    const elTotal = document.getElementById("kpi-total");
    const elSelesai = document.getElementById("kpi-selesai");
    const elProgres = document.getElementById("kpi-progres");

    if (elTotal) elTotal.textContent = totalProker;
    if (elSelesai) elSelesai.textContent = terlaksana;
    if (elProgres) elProgres.textContent = `${rataProgres}%`;
    // -----------------------------------------------------------------------

    // Isi opsi dropdown bidang secara otomatis
    const selectBidang = document.getElementById("filter-bidang");
    if (selectBidang) {
      const bidangUnik = [...new Set(allProker.map(item => item.bidang).filter(Boolean))];
      bidangUnik.forEach(bidang => {
        const opt = document.createElement("option");
        opt.value = bidang;
        opt.textContent = bidang;
        selectBidang.appendChild(opt);
      });
    }

    renderCards(allProker);
  } catch (error) {
    if (container) container.innerHTML = "<p>Gagal memuat data program kerja.</p>";
    console.error("Sync error:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadProkerDashboard();

  const searchEl = document.getElementById("search-input");
  const bidangEl = document.getElementById("filter-bidang");
  const statusEl = document.getElementById("filter-status");

  if (searchEl) searchEl.addEventListener("input", applyFilters);
  if (bidangEl) bidangEl.addEventListener("change", applyFilters);
  if (statusEl) statusEl.addEventListener("change", applyFilters);
});