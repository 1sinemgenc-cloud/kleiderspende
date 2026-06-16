const regions = [
  {
    name: "Ukraine",
    focus: "Warme Jacken, Schuhe und Decken",
    description: "Unterstuetzung fuer Familien in kalten Unterkuenften und Notquartieren.",
  },
  {
    name: "Syrien/Tuerkei",
    focus: "Kinderkleidung und Alltagskleidung",
    description: "Hilfe fuer Menschen, die nach Erdbeben und Konflikten neu versorgt werden muessen.",
  },
  {
    name: "Sudan",
    focus: "Leichte Kleidung und Schuhe",
    description: "Sortierte Kleidung fuer Vertriebene in Aufnahmezentren und mobilen Hilfsstellen.",
  },
  {
    name: "Gaza",
    focus: "Saubere Basiskleidung und Decken",
    description: "Dringend benoetigte Textilien fuer Familien in akuten Notsituationen.",
  },
];

const storageKey = "kleiderbruecke-donations";
const form = document.querySelector("#donationForm");
const regionCards = document.querySelector("#regionCards");
const regionSelect = document.querySelector("#region");
const donationRows = document.querySelector("#donationRows");
const successMessage = document.querySelector("#successMessage");
const statDonations = document.querySelector("#statDonations");
const clearButton = document.querySelector("#clearDonations");
const officeInfo = document.querySelector("#officeInfo");
const pickupAddressFields = document.querySelector("#pickupAddressFields");
const postalFeedback = document.querySelector("#postalFeedback");
const confirmationSection = document.querySelector("#bestaetigung");
const confirmationDetails = document.querySelector("#confirmationDetails");
const officeAddress = "KleiderBruecke e. V., Musterstrasse 12, 12345 Musterstadt";
const officePostalPrefix = "12";

function getDonations() {
  return JSON.parse(localStorage.getItem(storageKey) || "[]");
}

function saveDonations(donations) {
  localStorage.setItem(storageKey, JSON.stringify(donations));
}

function renderRegions() {
  regionSelect.innerHTML = '<option value="">Bitte waehlen</option>';
  regionCards.innerHTML = "";

  regions.forEach((region) => {
    const option = document.createElement("option");
    option.value = region.name;
    option.textContent = region.name;
    regionSelect.append(option);

    const card = document.createElement("article");
    card.className = "region-card";
    card.innerHTML = `
      <div>
        <span class="need-badge">${region.focus}</span>
        <h3 class="mt-3">${region.name}</h3>
        <p>${region.description}</p>
      </div>
      <button class="btn btn-outline-dark" type="button" data-region="${region.name}">Diese Region auswaehlen</button>
    `;
    regionCards.append(card);
  });
}

function renderDonations() {
  const donations = getDonations();
  statDonations.textContent = donations.length;

  if (donations.length === 0) {
    donationRows.innerHTML = '<tr><td class="empty-row" colspan="6">Noch keine Spende registriert.</td></tr>';
    return;
  }

  donationRows.innerHTML = donations.map((donation) => `
    <tr>
      <td><strong>${donation.id}</strong></td>
      <td>${donation.name}</td>
      <td>${donation.category}</td>
      <td>${donation.amount}</td>
      <td>${donation.region}</td>
      <td>${donation.place}</td>
    </tr>
  `).join("");
}

function createDonation(formData) {
  const donations = getDonations();
  const nextNumber = donations.length + 1;
  const handoverType = formData.get("handoverType");
  const now = new Date();
  const isPickup = handoverType === "pickup";
  const place = isPickup
    ? `${formData.get("street")}, ${formData.get("postalCode")} ${formData.get("city")}`
    : officeAddress;

  return {
    id: `KB-${String(nextNumber).padStart(4, "0")}`,
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    handoverType,
    handoverLabel: isPickup ? "Abholung durch Sammelfahrzeug" : "Uebergabe an der Geschaeftsstelle",
    place,
    pickupDate: formData.get("pickupDate"),
    category: formData.get("category"),
    amount: formData.get("amount"),
    region: formData.get("region"),
    notes: formData.get("notes"),
    date: now.toLocaleDateString("de-DE"),
    time: now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
    createdAt: now.toISOString(),
  };
}

function toggleHandoverFields() {
  const isPickup = form.elements.handoverType.value === "pickup";
  officeInfo.classList.toggle("d-none", isPickup);
  pickupAddressFields.classList.toggle("d-none", !isPickup);

  ["street", "postalCode", "city"].forEach((fieldName) => {
    form.elements[fieldName].required = isPickup;
  });

  if (!isPickup) {
    postalFeedback.classList.add("d-none");
    form.elements.postalCode.classList.remove("is-invalid");
  }
}

function validatePostalCode() {
  const isPickup = form.elements.handoverType.value === "pickup";
  const postalCode = form.elements.postalCode.value.trim();
  const isValid = !isPickup || postalCode.startsWith(officePostalPrefix);

  postalFeedback.classList.toggle("d-none", isValid);
  form.elements.postalCode.classList.toggle("is-invalid", !isValid);
  return isValid;
}

function renderConfirmation(donation) {
  const details = [
    ["Registrierungsnummer", donation.id],
    ["Art der Registrierung", donation.handoverLabel],
    ["Art der Kleider", donation.category],
    ["Menge", donation.amount],
    ["Krisengebiet", donation.region],
    ["Datum", donation.date],
    ["Uhrzeit", donation.time],
    ["Ort", donation.place],
  ];

  if (donation.pickupDate) {
    details.splice(7, 0, ["Gewuenschtes Abholdatum", new Date(donation.pickupDate).toLocaleDateString("de-DE")]);
  }

  confirmationDetails.innerHTML = details.map(([label, value]) => `
    <dt>${label}</dt>
    <dd>${value || "-"}</dd>
  `).join("");
  confirmationSection.classList.remove("d-none");
  confirmationSection.scrollIntoView({ behavior: "smooth" });
}

regionCards.addEventListener("click", (event) => {
  const button = event.target.closest("[data-region]");
  if (!button) return;

  regionSelect.value = button.dataset.region;
  document.querySelector("#registrieren").scrollIntoView({ behavior: "smooth" });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!validatePostalCode() || !form.checkValidity()) {
    form.classList.add("was-validated");
    return;
  }

  const donation = createDonation(new FormData(form));
  const donations = [...getDonations(), donation];
  saveDonations(donations);
  renderDonations();
  renderConfirmation(donation);

  successMessage.textContent = `Danke! Deine Spende wurde unter ${donation.id} fuer ${donation.region} registriert.`;
  successMessage.classList.remove("d-none");
  form.reset();
  form.classList.remove("was-validated");
});

clearButton.addEventListener("click", () => {
  localStorage.removeItem(storageKey);
  renderDonations();
  successMessage.classList.add("d-none");
  confirmationSection.classList.add("d-none");
});

form.addEventListener("change", (event) => {
  if (event.target.name === "handoverType") {
    toggleHandoverFields();
  }
  if (event.target.id === "postalCode") {
    validatePostalCode();
  }
});

form.addEventListener("reset", () => {
  setTimeout(toggleHandoverFields, 0);
});

renderRegions();
toggleHandoverFields();
renderDonations();
