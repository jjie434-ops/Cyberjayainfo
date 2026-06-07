const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyyDBx6AlIERwyKhAsLuzLHTcwJNvuA38613Xex_ic7w5tUrWbwPZL2Tpqk48UxFPyA/exec";
const WHATSAPP_LEAD_NUMBER = "60183759228";

const plans = {
  "1233sqft.png": "1,233 sqft",
  "1237sqft.png": "1,237 sqft",
  "1336sqft.png": "1,336 sqft",
  "1426sqft.png": "1,426 sqft",
  "1548sqft.png": "1,548 sqft",
  "1631sqft.png": "1,631 sqft",
};

function trackLeadEvent(eventName, details = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: eventName, ...details });

  if (typeof window.fbq === "function") {
    window.fbq("trackCustom", eventName, details);
  }
}

function buildWhatsAppLeadUrl(lead) {
  const message = [
    "Hi, I want to enquire about Myra Cove.",
    "",
    `Name: ${lead.name || ""}`,
    `Phone: ${lead.phone || ""}`,
    `Preferred Unit Size: ${lead.unit_size || ""}`,
    `Message: ${lead.message || ""}`,
  ].join("\n");

  return `https://wa.me/${WHATSAPP_LEAD_NUMBER}?text=${encodeURIComponent(message)}`;
}

async function submitLeadToGoogleSheet(lead) {
  if (!GOOGLE_SCRIPT_URL) {
    return { ok: false, reason: "missing-google-script-url" };
  }

  await fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(lead),
  });

  return { ok: true };
}

function setupPlanSelector() {
  const tabs = document.querySelectorAll(".size-tab");
  const image = document.getElementById("selectedPlanImage");
  const label = document.getElementById("selectedPlanLabel");
  const formSelect = document.querySelector('select[name="unit_size"]');

  if (!tabs.length || !image || !label) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const planFile = tab.dataset.plan;
      const planLabel = tab.dataset.label || plans[planFile];

      tabs.forEach((item) => {
        item.classList.remove("active");
        item.setAttribute("aria-selected", "false");
      });

      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
      image.src = `assets/${planFile}`;
      image.alt = `Myra Cove ${planLabel} floor plan`;
      label.textContent = planLabel;

      if (formSelect && planLabel) {
        formSelect.value = planLabel;
      }

      trackLeadEvent("floor_plan_select", { unit_size: planLabel });
    });
  });
}

function setupTrackingLinks() {
  document.querySelectorAll("[data-track]").forEach((element) => {
    if (element.tagName === "FORM") return;

    element.addEventListener("click", () => {
      trackLeadEvent(element.dataset.track, {
        label: element.textContent.trim(),
        href: element.getAttribute("href") || "",
      });
    });
  });
}

function captureUtmFields(form) {
  const params = new URLSearchParams(window.location.search);
  ["utm_source", "utm_medium", "utm_campaign", "utm_content"].forEach((key) => {
    const field = form.querySelector(`[name="${key}"]`);
    if (field) field.value = params.get(key) || "";
  });
}

function setupLeadForm() {
  const form = document.getElementById("leadForm");
  const status = document.getElementById("formStatus");

  if (!form || !status) return;

  captureUtmFields(form);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const lead = {
      ...Object.fromEntries(formData.entries()),
      page_url: window.location.href,
      user_agent: window.navigator.userAgent,
    };

    trackLeadEvent("form-submit", {
      unit_size: lead.unit_size,
      utm_source: lead.utm_source,
      utm_medium: lead.utm_medium,
      utm_campaign: lead.utm_campaign,
      utm_content: lead.utm_content,
    });

    status.textContent = "Submitting your enquiry...";

    try {
      const result = await submitLeadToGoogleSheet(lead);

      if (result.ok) {
        status.textContent = "Thank you. Your enquiry has been received.";
        form.reset();
        captureUtmFields(form);
        return;
      }

      window.open(buildWhatsAppLeadUrl(lead), "_blank", "noopener");
      status.textContent = "WhatsApp opened with your enquiry details.";
    } catch (error) {
      window.open(buildWhatsAppLeadUrl(lead), "_blank", "noopener");
      status.textContent = "WhatsApp opened with your enquiry details.";
    }
  });
}

function init() {
  setupPlanSelector();
  setupTrackingLinks();
  setupLeadForm();
}

document.addEventListener("DOMContentLoaded", init);
