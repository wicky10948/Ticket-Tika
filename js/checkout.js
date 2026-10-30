const checkoutEvents = (() => {
  try {
    const saved = JSON.parse(localStorage.getItem("tt_admin_events_v1") || "[]");
    return Array.isArray(saved) ? saved.filter(event => event && event.status !== "Draft").map(event => ({
      id: String(event.id || ""),
      title: String(event.name || "Untitled event"),
      date: event.date ? new Date(`${event.date}T12:00:00`).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" }) : "Date TBC",
      location: String(event.venue || "Location TBC"),
      price: Number(event.price || 0),
      image: String(event.poster || ""),
      soldOut: event.status === "Sold out" || (Number(event.capacity) > 0 && Number(event.sold || 0) >= Number(event.capacity))
    })).filter(event => event.id) : [];
  } catch {
    return [];
  }
})();

const params = new URLSearchParams(window.location.search);
const eventId = params.get("event");
const selectedEvent = checkoutEvents.find(event => event.id === eventId);
const quantityInput = document.getElementById("quantity");
const ticketPrice = document.getElementById("ticketPrice");
const summaryQuantity = document.getElementById("summaryQuantity");
const orderTotal = document.getElementById("orderTotal");
const checkoutForm = document.getElementById("checkoutForm");
const confirmationBox = document.getElementById("confirmationBox");

const formatMoney = value => `KSh ${Number(value).toLocaleString("en-KE")}`;

document.getElementById("eventTitle").textContent = selectedEvent?.title || "No event selected";
document.getElementById("eventMeta").textContent = selectedEvent ? `${selectedEvent.date} · ${selectedEvent.location}` : "No events are currently available.";
const summaryImage = document.querySelector(".summary-image");
const demoNotice = document.querySelector(".demo-notice");
demoNotice.textContent = selectedEvent ? "Demo only: payment methods are selectable, but real payments are not connected yet." : "There are no events to book right now. Please check back later.";
if (selectedEvent?.image) {
  summaryImage.style.backgroundImage = `url("${selectedEvent.image}")`;
  summaryImage.style.backgroundSize = "cover";
  summaryImage.style.backgroundPosition = "center";
}

ticketPrice.textContent = formatMoney(selectedEvent?.price || 0);
document.getElementById("year").textContent = new Date().getFullYear();

if (!selectedEvent || selectedEvent.soldOut) {
  checkoutForm.querySelectorAll("input, select, button").forEach(control => { control.disabled = true; });
  demoNotice.textContent = selectedEvent?.soldOut ? "This event is sold out and is no longer accepting bookings." : "There are no events to book right now. Please check back later.";
}

function updateTotal() {
  const quantity = Number(quantityInput.value);
  summaryQuantity.textContent = String(quantity);
  orderTotal.textContent = formatMoney((selectedEvent?.price || 0) * quantity);
}
quantityInput.addEventListener("change", updateTotal);
updateTotal();

checkoutForm.addEventListener("submit", event => {
  event.preventDefault();
  if (!selectedEvent) return;
  if (!checkoutForm.reportValidity()) return;

  const formData = new FormData(checkoutForm);
  const customerName = String(formData.get("fullName")).trim();
  const quantity = Number(formData.get("quantity"));
  const paymentMethod = formData.get("paymentMethod");
  const paymentLabel = paymentMethod === "card" ? "debit or credit card" : "M-Pesa";

  // Frontend demo only: do not store payment details or treat this as a real order.
  checkoutForm.hidden = true;
  document.querySelector(".order-summary").hidden = true;
  confirmationBox.hidden = false;
  document.getElementById("confirmationMessage").textContent =
    `Thanks, ${customerName}. You selected ${paymentLabel} for ${quantity} ticket${quantity === 1 ? "" : "s"} to ${selectedEvent.title}. This is only a demo: no payment was taken and no real ticket has been issued.`;
  confirmationBox.scrollIntoView({ behavior: "smooth", block: "start" });
});
