const ROOT_ID = "fokus-kerja-block";

function renderOverlay(payload) {
  const existing = document.getElementById(ROOT_ID);
  if (!payload?.blocked) {
    existing?.remove();
    return;
  }

  const root = existing ?? document.createElement("div");
  root.id = ROOT_ID;
  root.innerHTML = `
    <div class="fokus-card">
      <p class="fokus-stamp">Kuota habis · ${escapeHtml(payload.domain)}</p>
      <h1>Waktu untuk situs ini sudah terpakai hari ini.</h1>
      <p class="fokus-quote">${escapeHtml(payload.quote)}</p>
      <p class="fokus-meta">Tercatat ${escapeHtml(payload.formatted)} dari ${payload.limitMinutes} menit.</p>
      <p class="fokus-hint">Ubah kuota di dashboard Fokus Kerja. Overlay hilang besok, atau setelah batas dinaikkan.</p>
    </div>
  `;
  if (!existing) {
    document.documentElement.appendChild(root);
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "FOKUS_STATUS") {
    renderOverlay(message);
  }
});

chrome.runtime.sendMessage(
  { type: "FOKUS_GET_STATUS", domain: location.hostname },
  (status) => {
    if (chrome.runtime.lastError) return;
    renderOverlay(status);
  },
);
