import {
  findRule,
  formatDuration,
  isRuleEnforced,
  isTrackableUrl,
  normalizeDomain,
  quoteForDomain,
  todayISO,
} from "./lib.js";

const TICK_ALARM = "fokus-tick";
const SYNC_ALARM = "fokus-sync";
const DEFAULT_DASHBOARD = "https://focus-tracker-one-wheat.vercel.app";

const defaultState = () => ({
  session: null,
  dashboardUrl: DEFAULT_DASHBOARD,
  supabaseUrl: "",
  supabaseAnonKey: "",
  rules: [],
  usage: {},
  pendingSync: {},
  lastTickAt: Date.now(),
  active: {
    tabId: null,
    domain: null,
    startedAt: null,
    windowFocused: true,
    idle: false,
  },
});

async function loadState() {
  const stored = await chrome.storage.local.get("fokus");
  return { ...defaultState(), ...(stored.fokus ?? {}) };
}

async function saveState(state) {
  await chrome.storage.local.set({ fokus: state });
}

function canonicalDomain(state, domain) {
  return findRule(domain, state.rules)?.domain ?? domain;
}

function usageKey(domain, date = todayISO()) {
  return `${date}:${domain}`;
}

function usedSeconds(state, domain, date = todayISO()) {
  return state.usage[usageKey(canonicalDomain(state, domain), date)] ?? 0;
}

function addUsage(state, domain, seconds, date = todayISO()) {
  if (!domain || seconds <= 0) return;
  const key = usageKey(canonicalDomain(state, domain), date);
  state.usage[key] = (state.usage[key] ?? 0) + seconds;
  state.pendingSync[key] = (state.pendingSync[key] ?? 0) + seconds;
}

function isOverLimit(state, domain) {
  const rule = findRule(domain, state.rules);
  if (!rule) return false;
  if (!isRuleEnforced(rule)) return false;
  return usedSeconds(state, domain) >= rule.time_limit_minutes * 60;
}

async function setBadge(state, domain) {
  if (!domain) {
    await chrome.action.setBadgeText({ text: "" });
    return;
  }
  const rule = findRule(domain, state.rules);
  const used = usedSeconds(state, domain);
  if (!rule) {
    await chrome.action.setBadgeBackgroundColor({ color: "#2f5d50" });
    await chrome.action.setBadgeText({ text: formatBadge(used) });
    return;
  }
  const remaining = Math.max(0, rule.time_limit_minutes * 60 - used);
  const over = isRuleEnforced(rule) && remaining === 0;
  await chrome.action.setBadgeBackgroundColor({ color: over ? "#c45c26" : "#2f5d50" });
  await chrome.action.setBadgeText({ text: over ? "STOP" : formatBadge(remaining) });
}

function formatBadge(seconds) {
  const minutes = Math.max(0, Math.round(seconds / 60));
  if (minutes >= 100) return `${Math.floor(minutes / 60)}j`;
  return String(minutes);
}

async function ensureAlarms() {
  await chrome.alarms.create(TICK_ALARM, { periodInMinutes: 0.5 });
  await chrome.alarms.create(SYNC_ALARM, { periodInMinutes: 1 });
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tab ?? null;
}

async function flushActive(state, now = Date.now()) {
  const { domain, startedAt, windowFocused, idle } = state.active;
  if (!domain || !startedAt || !windowFocused || idle) {
    state.active.startedAt = now;
    state.lastTickAt = now;
    return;
  }
  const elapsed = Math.floor((now - startedAt) / 1000);
  if (elapsed > 0) {
    addUsage(state, domain, Math.min(elapsed, 120));
  }
  state.active.startedAt = now;
  state.lastTickAt = now;
}

async function notifyTab(tabId, state, domain) {
  if (!tabId || !domain) return;
  const rule = findRule(domain, state.rules);
  const used = usedSeconds(state, domain);
  const active = rule ? isRuleEnforced(rule) : true;
  const blocked = Boolean(rule && active && used >= rule.time_limit_minutes * 60);
  const payload = {
    type: "FOKUS_STATUS",
    domain,
    usedSeconds: used,
    limitMinutes: rule?.time_limit_minutes ?? null,
    blocked,
    quote: quoteForDomain(domain, todayISO()),
    formatted: formatDuration(used),
  };
  try {
    await chrome.tabs.sendMessage(tabId, payload);
  } catch {
    if (blocked) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ["content.js"],
        });
        await chrome.tabs.sendMessage(tabId, payload);
      } catch {
        // Restricted pages (chrome://, Web Store) cannot be injected.
      }
    }
  }
}

async function trackActiveTab(state) {
  const tab = await getActiveTab();
  const now = Date.now();
  const nextDomain =
    tab?.url && isTrackableUrl(tab.url) ? normalizeDomain(new URL(tab.url).hostname) : null;
  const nextTabId = tab?.id ?? null;

  if (state.active.domain && state.active.domain !== nextDomain) {
    await flushActive(state, now);
  }

  state.active.tabId = nextTabId;
  state.active.domain = nextDomain;
  if (!state.active.startedAt) state.active.startedAt = now;
  if (nextDomain) {
    await notifyTab(nextTabId, state, nextDomain);
  }
  await setBadge(state, nextDomain);
}

async function supabaseHeaders(state) {
  if (!state.session?.access_token || !state.supabaseUrl || !state.supabaseAnonKey) {
    return null;
  }
  return {
    apikey: state.supabaseAnonKey,
    Authorization: `Bearer ${state.session.access_token}`,
    "Content-Type": "application/json",
  };
}

async function refreshSession(state) {
  if (!state.session?.refresh_token || !state.supabaseUrl || !state.supabaseAnonKey) {
    return false;
  }
  const response = await fetch(`${state.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: {
      apikey: state.supabaseAnonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: state.session.refresh_token }),
  });
  if (!response.ok) {
    state.session = null;
    return false;
  }
  const data = await response.json();
  state.session = {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? state.session.refresh_token,
    expires_at: data.expires_at,
    user: data.user ?? state.session.user,
  };
  return true;
}

async function pullRemote(state) {
  const headers = await supabaseHeaders(state);
  if (!headers) return;
  const userId = state.session?.user?.id;
  if (!userId) return;

  const rulesRes = await fetch(
    `${state.supabaseUrl}/rest/v1/rules?user_id=eq.${userId}&select=*`,
    { headers },
  );
  if (rulesRes.status === 401 && (await refreshSession(state))) {
    return pullRemote(state);
  }
  if (rulesRes.ok) {
    state.rules = await rulesRes.json();
  }

  const since = todayISO(new Date(Date.now() - 6 * 86400000));
  const usageRes = await fetch(
    `${state.supabaseUrl}/rest/v1/daily_analytics?user_id=eq.${userId}&date=gte.${since}&select=domain,date,time_spent_seconds`,
    { headers },
  );
  if (usageRes.ok) {
    const rows = await usageRes.json();
    for (const row of rows) {
      const key = usageKey(row.domain, row.date);
      const local = state.usage[key] ?? 0;
      state.usage[key] = Math.max(local, row.time_spent_seconds ?? 0);
    }
  }
}

async function pushPending(state) {
  const headers = await supabaseHeaders(state);
  if (!headers) return;
  const entries = Object.entries(state.pendingSync);
  if (entries.length === 0) return;

  for (const [key, seconds] of entries) {
    if (!seconds) {
      delete state.pendingSync[key];
      continue;
    }
    const [date, ...domainParts] = key.split(":");
    const domain = domainParts.join(":");
    const response = await fetch(`${state.supabaseUrl}/rest/v1/rpc/increment_daily_time`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        p_domain: domain,
        p_seconds: seconds,
        p_date: date,
      }),
    });
    if (response.status === 401 && (await refreshSession(state))) {
      return pushPending(state);
    }
    if (response.ok) {
      delete state.pendingSync[key];
    }
  }
}

async function findDashboardTab(base) {
  const pattern = `${base}/*`;
  const existing = await chrome.tabs.query({ url: pattern });
  return existing[0] ?? null;
}

async function openDashboardLogin(base, tabId = null) {
  const url = `${base}/login?next=/dashboard`;
  if (tabId) {
    await chrome.tabs.update(tabId, { url, active: true });
    return;
  }
  await chrome.tabs.create({ url, active: true });
}

async function syncFromDashboard(state, { openLogin = false, tabId = null } = {}) {
  const base = (state.dashboardUrl || DEFAULT_DASHBOARD).replace(/\/$/, "");
  try {
    const tab = tabId ? await chrome.tabs.get(tabId) : await findDashboardTab(base);
    if (!tab?.id) {
      if (openLogin) await openDashboardLogin(base);
      return { ok: false, reason: "login_required" };
    }
    const [injected] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: async () => {
        const response = await fetch("/api/extension/session", {
          credentials: "include",
        });
        return response.json();
      },
    });
    const data = injected?.result;
    if (!data?.authenticated) {
      if (openLogin) await openDashboardLogin(base, tab.id);
      return { ok: false, reason: "login_required" };
    }
    state.session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      user: data.user,
    };
    if (data.supabase_url) state.supabaseUrl = data.supabase_url;
    if (data.supabase_anon_key) state.supabaseAnonKey = data.supabase_anon_key;
    return { ok: true, email: data.user?.email ?? null };
  } catch {
    return { ok: false, reason: "dashboard_unavailable" };
  }
}

async function syncCompletedDashboardTab(tabId, url) {
  const state = await loadState();
  const base = (state.dashboardUrl || DEFAULT_DASHBOARD).replace(/\/$/, "");
  if (!url?.startsWith(`${base}/`)) return;
  const result = await syncFromDashboard(state, { tabId });
  if (!result.ok) return;
  await pullRemote(state);
  await pushPending(state);
  await saveState(state);
}

async function tick() {
  const state = await loadState();
  await flushActive(state);
  await trackActiveTab(state);
  await saveState(state);
}

async function sync() {
  const state = await loadState();
  await flushActive(state);
  if (state.session) {
    await pushPending(state);
    await pullRemote(state);
  }
  await trackActiveTab(state);
  await saveState(state);
}

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  await ensureAlarms();
  const state = await loadState();
  state.dashboardUrl = DEFAULT_DASHBOARD;
  await saveState(state);
  if (reason === "install") {
    await openDashboardLogin(DEFAULT_DASHBOARD);
  }
});

chrome.runtime.onStartup.addListener(async () => {
  await ensureAlarms();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === TICK_ALARM) await tick();
  if (alarm.name === SYNC_ALARM) await sync();
});

chrome.tabs.onActivated.addListener(async () => {
  await tick();
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" || changeInfo.url) {
    await tick();
  }
  if (changeInfo.status === "complete") {
    await syncCompletedDashboardTab(tabId, tab.url);
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  const state = await loadState();
  await flushActive(state);
  state.active.windowFocused = windowId !== chrome.windows.WINDOW_ID_NONE;
  if (state.active.windowFocused) state.active.startedAt = Date.now();
  await trackActiveTab(state);
  await saveState(state);
});

chrome.idle.onStateChanged.addListener(async (idleState) => {
  const state = await loadState();
  await flushActive(state);
  state.active.idle = idleState !== "active";
  if (!state.active.idle) state.active.startedAt = Date.now();
  await saveState(state);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    const state = await loadState();
    if (message?.type === "FOKUS_GET_STATUS") {
      const domain = message.domain
        ? normalizeDomain(message.domain)
        : state.active.domain;
      const rule = domain ? findRule(domain, state.rules) : null;
      sendResponse({
        domain,
        usedSeconds: domain ? usedSeconds(state, domain) : 0,
        limitMinutes: rule?.time_limit_minutes ?? null,
        blocked: domain ? isOverLimit(state, domain) : false,
        quote: domain ? quoteForDomain(domain, todayISO()) : "",
        signedIn: Boolean(state.session),
        email: state.session?.user?.email ?? null,
        dashboardUrl: state.dashboardUrl,
        pendingCount: Object.keys(state.pendingSync).length,
        rules: state.rules,
      });
      return;
    }
    if (message?.type === "FOKUS_SYNC_SESSION") {
      const result = await syncFromDashboard(state, { openLogin: true });
      if (result.ok) {
        await pullRemote(state);
        await pushPending(state);
      }
      await saveState(state);
      sendResponse({
        ok: result.ok,
        reason: result.reason ?? null,
        signedIn: Boolean(state.session),
        email: state.session?.user?.email ?? null,
      });
      return;
    }
    if (message?.type === "FOKUS_SIGNOUT") {
      state.session = null;
      await saveState(state);
      sendResponse({ ok: true });
    }
  })();
  return true;
});
