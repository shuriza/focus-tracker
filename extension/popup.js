import { formatDuration } from "./lib.js";

const domainEl = document.getElementById("domain");
const usageEl = document.getElementById("usage");
const quoteEl = document.getElementById("quote");
const sessionEl = document.getElementById("session");
const statusEl = document.getElementById("status");
const sessionBoxEl = sessionEl.closest(".session-box");
const syncEl = document.getElementById("sync");
const signoutEl = document.getElementById("signout");

function render(status) {
  if (!status.domain) {
    domainEl.textContent = "Tidak ada tab tercatat";
    usageEl.textContent = "Buka situs http/https untuk mulai timer.";
    quoteEl.hidden = true;
  } else {
    domainEl.textContent = status.domain;
    const limit = status.limitMinutes
      ? ` dari ${status.limitMinutes} menit`
      : " · tanpa kuota";
    usageEl.textContent = `${formatDuration(status.usedSeconds)}${limit}${
      status.blocked ? " · diblokir" : ""
    }`;
    if (status.blocked) {
      quoteEl.hidden = false;
      quoteEl.textContent = status.quote;
    } else {
      quoteEl.hidden = true;
    }
  }
  sessionEl.textContent = status.signedIn
    ? `Sesi aktif: ${status.email}`
    : "Belum tersinkron. Hubungkan akun untuk memuat aturan dan analitik.";
  sessionBoxEl.classList.toggle("connected", status.signedIn);
  syncEl.textContent = status.signedIn ? "Perbarui Data" : "Masuk & Sinkronkan";
  signoutEl.hidden = !status.signedIn;
}

chrome.runtime.sendMessage({ type: "FOKUS_GET_STATUS" }, (status) => {
  if (chrome.runtime.lastError) {
    statusEl.textContent = chrome.runtime.lastError.message;
    return;
  }
  render(status);
});

syncEl.addEventListener("click", () => {
  syncEl.disabled = true;
  statusEl.textContent = "Menghubungkan ke dashboard...";
  chrome.runtime.sendMessage({ type: "FOKUS_SYNC_SESSION" }, (result) => {
    syncEl.disabled = false;
    if (chrome.runtime.lastError) {
      statusEl.textContent = chrome.runtime.lastError.message;
      return;
    }
    if (result?.ok) {
      statusEl.textContent = `Data diperbarui sebagai ${result.email}`;
    } else if (result?.reason === "login_required") {
      statusEl.textContent = "Selesaikan login di tab yang dibuka. Sesi akan tersinkron otomatis.";
    } else {
      statusEl.textContent = "Dashboard tidak dapat dihubungi. Coba lagi.";
    }
    chrome.runtime.sendMessage({ type: "FOKUS_GET_STATUS" }, render);
  });
});

signoutEl.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "FOKUS_SIGNOUT" }, () => {
    statusEl.textContent = "Sesi ekstensi diputus. Timer lokal tetap jalan.";
    chrome.runtime.sendMessage({ type: "FOKUS_GET_STATUS" }, render);
  });
});
