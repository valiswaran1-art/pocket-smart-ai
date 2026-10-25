const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const state = { user: null, plans: [], category: "home", authMode: "login", toastTimer: null };

const planners = {
  home: {
    title: "Plan your home.", eyebrow: "A HOME THAT FEELS LIKE YOU", description: "Make room-by-room decisions with your total budget in mind.", badge: "⌂", crumb: "Home planner",
  },
  party: {
    title: "Plan a gathering.", eyebrow: "BRING EVERYONE TOGETHER", description: "A thoughtful plan for the moments worth celebrating.", badge: "✳", crumb: "Party planner",
  },
  jewelry: {
    title: "Find your special piece.", eyebrow: "A LITTLE SOMETHING SPECIAL", description: "Discover occasion-ready jewelry that feels like you.", badge: "◇", crumb: "Jewelry planner",
  },
};

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
    credentials: "same-origin",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Something went wrong. Please try again.");
  return payload;
}

function setAuthMode(mode) {
  state.authMode = mode;
  const isSignup = mode === "signup";
  $("#signin-tab").classList.toggle("active", !isSignup);
  $("#signup-tab").classList.toggle("active", isSignup);
  $("#signin-tab").setAttribute("aria-selected", String(!isSignup));
  $("#signup-tab").setAttribute("aria-selected", String(isSignup));
  $("#auth-title").textContent = isSignup ? "Let’s make a little room." : "A smarter way to plan.";
  $("#auth-subtitle").textContent = isSignup ? "Create your account and start shaping a plan that feels like yours." : "Sign in to pick up right where your plans left off.";
  $("#auth-submit").innerHTML = isSignup ? 'Create account <span aria-hidden="true">↗</span>' : 'Sign in <span aria-hidden="true">↗</span>';
  $("#password").autocomplete = isSignup ? "new-password" : "current-password";
  $("#password-hint").hidden = !isSignup;
  $("#auth-message").textContent = "";
}

function showApp() {
  $("#auth-screen").hidden = true;
  $("#app-screen").hidden = false;
  $("#user-email").textContent = state.user.email;
  $("#avatar-initials").textContent = state.user.email.slice(0, 2).toUpperCase();
  $("#welcome-title").textContent = `Good things are in the making, ${state.user.email.split("@")[0]}.`;
  renderPlans();
}

function showAuth() {
  state.user = null;
  state.plans = [];
  $("#app-screen").hidden = true;
  $("#auth-screen").hidden = false;
  setAuthMode("login");
}

function updateGeminiStatus(configured) {
  $("#recommendation-mode").textContent = configured ? "Gemini recommendations" : "Sample recommendations";
  $("#auth-key-setup").hidden = configured;
  $$(".top-key-setup").forEach((button) => { button.hidden = configured; });
}

function showView(view) {
  const isDashboard = view === "dashboard";
  $("#dashboard-view").hidden = !isDashboard;
  $("#planner-view").hidden = isDashboard;
  if (!isDashboard) {
    state.category = view;
    const planner = planners[view];
    $("#planner-category").value = view;
    $("#planner-title").textContent = planner.title;
    $("#planner-eyebrow").textContent = planner.eyebrow;
    $("#planner-description").textContent = planner.description;
    $("#planner-badge").textContent = planner.badge;
    $("#aside-illustration").textContent = planner.badge;
    $("#page-crumb").textContent = planner.crumb;
    $$(".conditional-fields").forEach((section) => { section.hidden = !section.id.startsWith(`${view}-`); });
    $("#planner-message").textContent = "";
    closeMenu();
  } else {
    $("#page-crumb").textContent = "Overview";
  }
  $$(".nav-link").forEach((link) => link.classList.toggle("active", link.dataset.view === view));
  $("#results-section").hidden = true;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function closeMenu() {
  $("#sidebar").classList.remove("open");
  $("#sidebar-scrim").classList.remove("open");
}

function displayMoney(value) {
  return `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function categoryTitle(category) {
  return { home: "Home plan", party: "Gathering plan", jewelry: "Jewelry plan" }[category] || "Budget plan";
}

function renderPlans() {
  const list = $("#recent-list");
  $("#recent-count").textContent = `${state.plans.length} SAVED`;
  if (!state.plans.length) {
    list.innerHTML = '<div class="empty-state"><span>✳</span><strong>Nothing planned just yet.</strong><p>Your saved plans will find a home here.</p></div>';
    return;
  }
  list.innerHTML = state.plans.slice(0, 4).map((plan) => {
    const planIcon = { home: ["home", "⌂"], party: ["party", "✳"], jewelry: ["jewelry", "◇"] }[plan.category] || ["default", "✳"];
    return `<article class="recent-plan"><span class="recent-plan-icon recent-plan-icon-${planIcon[0]}">${planIcon[1]}</span><div class="recent-plan-copy"><strong>${escapeHtml(categoryTitle(plan.category))}</strong><span>${new Date(plan.createdAt).toLocaleDateString()} · ${plan.recommendations?.length || 0} ideas</span></div><span class="recent-plan-amount">${displayMoney(plan.budget)}</span></article>`;
  }).join("");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

function renderResults(plan) {
  const section = $("#results-section");
  const allocated = Number(plan.allocated) || 0;
  const budget = Number(plan.budget) || 0;
  const percent = budget > 0 ? Math.min(100, (allocated / budget) * 100) : 0;
  const meterClass = `budget-meter-fill-${Math.ceil(percent / 5) * 5}`;
  const breakdown = (plan.budgetBreakdown || []).map((item) => `<article class="breakdown-card"><strong>${escapeHtml(item.category)}</strong><span>${displayMoney(item.amount)}</span><p>${escapeHtml(item.note)}</p></article>`).join("");
  const recommendations = (plan.recommendations || []).map((item) => `<article class="recommendation-card"><div class="recommendation-top"><span class="platform-tag">${escapeHtml(item.platform)}</span><span class="recommendation-price">~ ${displayMoney(item.estimatedPrice)}</span></div><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.details || item.category || "Suggested option")}</p><a href="${escapeHtml(item.searchUrl)}" target="_blank" rel="noopener noreferrer">Search on ${escapeHtml(item.platform)} ↗</a></article>`).join("");
  const tips = plan.tips?.length ? `<div class="tips-list"><strong>A few thoughtful tips</strong><ul>${plan.tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}</ul></div>` : "";
  section.innerHTML = `
    <div class="result-header"><div><span class="eyebrow">A FIRST DRAFT, MADE FOR YOU</span><h2>Your plan is taking shape.</h2><p class="source-label">${escapeHtml(plan.sourceLabel || "Estimated recommendations")}</p></div></div>
    <div class="budget-summary"><div class="budget-summary-top"><strong>Budget check</strong><span class="${plan.overBudget ? "over-budget" : ""}">${displayMoney(allocated)} allocated &nbsp;·&nbsp; ${plan.overBudget ? `${displayMoney(Math.abs(plan.remaining))} over` : `${displayMoney(plan.remaining)} remaining`}</span></div><div class="budget-meter ${plan.overBudget ? "over" : ""}"><span class="${meterClass}"></span></div><div class="budget-labels"><span>Allocated ${displayMoney(allocated)}</span><span>Your budget ${displayMoney(budget)}</span></div>${plan.overBudget ? '<p class="result-warning">This draft exceeds your budget. Try reducing quantities or adjusting categories before you commit.</p>' : ""}</div>
    <p class="result-summary">${escapeHtml(plan.summary)}</p>
    ${breakdown ? `<div class="section-heading"><div><span class="eyebrow">A THOUGHTFUL SPLIT</span><h2>Budget breakdown</h2></div></div><div class="breakdown-grid">${breakdown}</div>` : ""}
    <div class="section-heading"><div><span class="eyebrow">OPTIONS TO EXPLORE</span><h2>Ideas for your plan</h2></div></div>
    ${recommendations ? `<div class="recommendation-grid">${recommendations}</div>` : '<div class="empty-state"><strong>No platform recommendations were returned.</strong><p>Try again with a little more detail.</p></div>'}
    ${tips}
    <p class="price-notice">${escapeHtml(plan.priceNotice || "Estimates only — confirm current prices and availability with the platform.")}</p>`;
  section.hidden = false;
  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

function readItemRows() {
  return $$(".item-row", $("#home-items")).map((row) => ({
    name: $(".item-name", row).value.trim(),
    quantity: Math.max(1, Number($(".item-quantity", row).value) || 1),
  })).filter((item) => item.name);
}

async function readOutfitImage(file) {
  if (!file) return undefined;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 4 * 1024 * 1024) {
    throw new Error("Choose a JPEG, PNG, or WebP image under 4 MB.");
  }
  const data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(new Error("Could not read that image. Please try another."));
    reader.readAsDataURL(file);
  });
  return { mimeType: file.type, data };
}

function collectPlanDetails(category) {
  if (category === "home") {
    return {
      roomTypes: $$("#room-choices input:checked").map((input) => input.value),
      items: readItemRows(),
    };
  }
  if (category === "party") {
    return {
      eventType: $("#event-type").value,
      guests: Number($("#guests").value) || 0,
      eventDate: $("#event-date").value,
      venue: $("#venue").value.trim(),
      accommodation: $("#accommodation").checked,
    };
  }
  return {
    occasion: $("#occasion").value,
    style: $("#jewelry-style").value,
    material: $("#material").value,
    color: $("#color").value.trim(),
    design: $("#design").value.trim(),
  };
}

async function submitPlan(event) {
  event.preventDefault();
  const category = state.category;
  const budget = Number($("#budget").value);
  const message = $("#planner-message");
  const button = $("#generate-button");
  message.textContent = "";
  if (!Number.isFinite(budget) || budget < 500 || budget > 10000000) {
    message.textContent = "Enter a budget between ₹500 and ₹1 crore.";
    $("#budget").focus();
    return;
  }
  if (category === "home" && !$("#room-choices").querySelectorAll("input:checked").length && !readItemRows().length) {
    message.textContent = "Choose at least one room or enter an item for your home plan.";
    return;
  }
  if (category === "party" && !$("#event-type").value) {
    message.textContent = "Choose an event type so we can shape a relevant plan.";
    $("#event-type").focus();
    return;
  }
  if (category === "jewelry" && !$("#occasion").value) {
    message.textContent = "Choose an occasion so we can tailor the suggestions.";
    $("#occasion").focus();
    return;
  }
  button.disabled = true;
  button.innerHTML = "<span>Thinking through your plan…</span><span aria-hidden='true'>✳</span>";
  try {
    const outfitImage = category === "jewelry" ? await readOutfitImage($("#outfit-image").files[0]) : undefined;
    const payload = { category, budget, details: collectPlanDetails(category), ...(outfitImage ? { outfitImage } : {}) };
    const result = await api("/api/plans", { method: "POST", body: JSON.stringify(payload) });
    state.plans.unshift(result.plan);
    renderPlans();
    renderResults(result.plan);
    showToast("Your plan is ready to explore.");
  } catch (error) {
    message.textContent = error.message;
  } finally {
    button.disabled = false;
    button.innerHTML = "<span>Generate my plan</span><span aria-hidden='true'>✳</span>";
  }
}

async function signOut() {
  try {
    await api("/api/auth/logout", { method: "POST", body: "{}" });
  } catch (error) {
    showToast(error.message);
  }
  showAuth();
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
}

function bindEvents() {
  $$("[data-open-gemini]").forEach((button) => button.addEventListener("click", () => {
    $("#gemini-message").textContent = "";
    $("#gemini-api-key").value = "";
    $("#gemini-dialog").showModal();
    $("#gemini-api-key").focus();
  }));
  $("#close-gemini-dialog").addEventListener("click", () => $("#gemini-dialog").close());
  $("#gemini-dialog").addEventListener("click", (event) => {
    if (event.target === $("#gemini-dialog")) $("#gemini-dialog").close();
  });
  $("#gemini-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = $("#save-gemini-key");
    const message = $("#gemini-message");
    const key = $("#gemini-api-key").value.trim();
    message.textContent = "";
    button.disabled = true;
    button.innerHTML = "<span>Checking with Google…</span>";
    try {
      await api("/api/config/gemini", { method: "POST", body: JSON.stringify({ apiKey: key }) });
      updateGeminiStatus(true);
      $("#gemini-api-key").value = "";
      $("#gemini-dialog").close();
      showToast("Gemini is connected. Your key stays in server memory.");
    } catch (error) {
      message.textContent = error.message;
    } finally {
      button.disabled = false;
      button.innerHTML = 'Validate and connect <span aria-hidden="true">↗</span>';
    }
  });
  $("#signin-tab").addEventListener("click", () => setAuthMode("login"));
  $("#signup-tab").addEventListener("click", () => setAuthMode("signup"));
  $("#auth-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = $("#auth-message");
    const button = $("#auth-submit");
    message.textContent = "";
    button.disabled = true;
    try {
      const payload = await api(`/api/auth/${state.authMode}`, {
        method: "POST",
        body: JSON.stringify({ email: $("#email").value, password: $("#password").value }),
      });
      state.user = payload.user;
      const saved = await api("/api/plans");
      state.plans = saved.plans;
      showApp();
    } catch (error) {
      message.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
  $$("[data-view]").forEach((button) => button.addEventListener("click", () => showView(button.dataset.view)));
  $("#back-dashboard").addEventListener("click", () => showView("dashboard"));
  $("#planner-form").addEventListener("submit", submitPlan);
  $("#logout-button").addEventListener("click", signOut);
  $("#top-logout-button").addEventListener("click", signOut);
  $("#menu-button").addEventListener("click", () => {
    $("#sidebar").classList.add("open");
    $("#sidebar-scrim").classList.add("open");
  });
  $("#sidebar-scrim").addEventListener("click", closeMenu);
  $("#add-home-item").addEventListener("click", () => {
    if ($$(".item-row", $("#home-items")).length >= 12) {
      showToast("You can add up to 12 items.");
      return;
    }
    const row = document.createElement("div");
    row.className = "item-row";
    row.innerHTML = '<input class="item-name" type="text" placeholder="e.g. Ceiling fan" maxlength="80"><input class="item-quantity" type="number" min="1" max="100" value="1" aria-label="Quantity"><button class="remove-item" type="button" aria-label="Remove item">×</button>';
    $("#home-items").append(row);
    $(".item-name", row).focus();
  });
  $("#home-items").addEventListener("click", (event) => {
    if (event.target.matches(".remove-item")) {
      const rows = $$(".item-row", $("#home-items"));
      if (rows.length === 1) {
        $(".item-name", rows[0]).value = "";
        $(".item-quantity", rows[0]).value = "1";
      } else event.target.closest(".item-row").remove();
    }
  });
  $("#outfit-image").addEventListener("change", (event) => {
    const file = event.target.files[0];
    $("#file-name").textContent = file ? file.name : "Your image is processed for this request only.";
  });
  $("#today-label").textContent = new Intl.DateTimeFormat("en-IN", { weekday: "long", month: "long", day: "numeric" }).format(new Date()).toUpperCase();
}

async function initialize() {
  bindEvents();
  try {
    const health = await api("/api/health");
    updateGeminiStatus(health.geminiConfigured);
  } catch {
    updateGeminiStatus(false);
    $("#recommendation-mode").textContent = "Planner unavailable";
  }
  try {
    const response = await api("/api/auth/me");
    state.user = response.user;
    const saved = await api("/api/plans");
    state.plans = saved.plans;
    showApp();
  } catch {
    showAuth();
  }
}

initialize();
