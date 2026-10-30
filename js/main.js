const loadEvents = () => {
  try {
    const saved = JSON.parse(localStorage.getItem("tt_admin_events_v1") || "[]");
    return Array.isArray(saved) ? saved.filter(event => event && event.status !== "Draft").map(event => ({
      id: String(event.id || ""),
      title: String(event.name || "Untitled event"),
      category: String(event.category || "Event"),
      location: String(event.venue || "Location TBC"),
      description: "",
      date: event.date ? new Date(`${event.date}T12:00:00`).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" }) : "Date TBC",
      price: Number(event.price || 0),
      image: String(event.poster || ""),
      soldOut: event.status === "Sold out" || (Number(event.capacity) > 0 && Number(event.sold || 0) >= Number(event.capacity))
    })).filter(event => event.id) : [];
  } catch {
    return [];
  }
};

let events = loadEvents();
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[character]));

const grid = document.getElementById("eventGrid");
const searchInput = document.getElementById("eventSearch");
const filters = document.getElementById("categoryFilters");
const resultsCount = document.getElementById("resultsCount");
const emptyState = document.getElementById("emptyState");
const toast = document.getElementById("toast");
let activeCategory = "All";
let toastTimer;

const money = amount => `KSh ${Number(amount).toLocaleString("en-KE")}`;

function renderEvents() {
  if (!grid) return;
  const query = (searchInput?.value || "").trim().toLowerCase();
  const visible = events.filter(event => {
    const matchesCategory = activeCategory === "All" || event.category === activeCategory;
    const searchable = `${event.title} ${event.category} ${event.location} ${event.description}`.toLowerCase();
    return matchesCategory && searchable.includes(query);
  });

  grid.innerHTML = visible.map(event => `
    <article class="event-card">
      <div class="event-image${event.image ? "" : " event-image-placeholder"}">
        ${event.image ? `<img src="${escapeHtml(event.image)}" alt="${escapeHtml(event.title)}" loading="lazy">` : '<span aria-hidden="true">✦</span>'}
        <span class="event-category">${escapeHtml(event.category)}</span>
      </div>
      <div class="event-body">
        <p class="event-date">${escapeHtml(event.date)}</p>
        <h3>${escapeHtml(event.title)}</h3>
        <p class="event-location">⌖ &nbsp; ${escapeHtml(event.location)}</p>
        <div class="event-footer">
          <div class="event-price"><small>Tickets from</small><strong>${money(event.price)}</strong></div>
          <button class="event-buy" type="button" data-event-id="${escapeHtml(event.id)}"${event.soldOut ? " disabled" : ""}>${event.soldOut ? "Sold out" : "Get tickets ↗"}</button>
        </div>
      </div>
    </article>
  `).join("");

  if (resultsCount) resultsCount.textContent = `Showing ${visible.length} ${visible.length === 1 ? "event" : "events"}`;
  if (emptyState) emptyState.hidden = visible.length !== 0;
  if (grid) grid.hidden = visible.length === 0;
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

searchInput?.addEventListener("input", renderEvents);

filters?.addEventListener("click", event => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeCategory = button.dataset.category;
  filters.querySelectorAll(".filter-btn").forEach(btn => btn.classList.toggle("active", btn === button));
  renderEvents();
});

grid?.addEventListener("click", event => {
  const button = event.target.closest("[data-event-id]");
  if (!button) return;
  const selected = events.find(item => item.id === button.dataset.eventId);
  if (!selected || selected.soldOut) return;
  // The chosen event is passed to checkout using the URL query string.
  window.location.href = `checkout.html?event=${encodeURIComponent(selected.id)}`;
});

document.getElementById("resetFilters")?.addEventListener("click", () => {
  activeCategory = "All";
  if (searchInput) searchInput.value = "";
  filters?.querySelectorAll(".filter-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.category === "All"));
  renderEvents();
});

const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
menuToggle?.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});
navLinks?.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
  navLinks.classList.remove("open");
  menuToggle?.setAttribute("aria-expanded", "false");
}));

document.getElementById("year")?.append(document.createTextNode(String(new Date().getFullYear())));
renderEvents();
window.addEventListener("storage", event => {
  if (event.key === "tt_admin_events_v1") {
    events = loadEvents();
    renderEvents();
  }
});
