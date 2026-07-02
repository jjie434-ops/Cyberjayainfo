const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyyDBx6AlIERwyKhAsLuzLHTcwJNvuA38613Xex_ic7w5tUrWbwPZL2Tpqk48UxFPyA/exec";
const WHATSAPP_LEAD_NUMBER = "60183759228";

// === Google Ads conversion tracking =========================================
// gtag.js for AW-18214182069 is loaded in index.html, but a conversion is only
// recorded when gtag('event','conversion', ...) fires. Paste the "label" for
// each conversion action from Google Ads → Goals → Conversions → [action] →
// "Tag setup" (the value after the slash, e.g. AW-18214182069/AbCdEf...).
// Leave a label as "" to skip it safely until you have it.
const ADS_CONVERSION_ID = "AW-18214182069";
const ADS_CONVERSION_LABELS = {
  whatsapp: "z00FCNbkiLscELW5me1D", // "Submit lead form whatsapp and google sheet" (secondary)
  form: "s6aiCM7RqMkcELW5me1D",     // "Form Submit" — primary lead action (value 1.0 MYR)
};

function fireAdsConversion(type) {
  const label = ADS_CONVERSION_LABELS[type];
  if (typeof window.gtag !== "function" || !label) return;
  const payload = {
    send_to: `${ADS_CONVERSION_ID}/${label}`,
    // transport_type "beacon" uses navigator.sendBeacon so the conversion is
    // sent reliably even when the WhatsApp link navigates the page away.
    transport_type: "beacon",
  };
  if (type === "form") {
    payload.value = 1.0;
    payload.currency = "MYR";
  }
  window.gtag("event", "conversion", payload);
}
// ============================================================================

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

function openWhatsAppLead(lead) {
  const whatsAppUrl = buildWhatsAppLeadUrl(lead);
  window.open(whatsAppUrl, "_blank", "noopener");
  return whatsAppUrl;
}

function setFormStatus(status, message, whatsAppUrl = "") {
  status.textContent = message;

  if (!whatsAppUrl) return;

  const link = document.createElement("a");
  link.href = whatsAppUrl;
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = "Open WhatsApp";

  status.append(" ", link);
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

      if (element.dataset.track === "whatsapp") {
        fireAdsConversion("whatsapp");
      }
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

    fireAdsConversion("form");

    const whatsAppUrl = openWhatsAppLead(lead);
    setFormStatus(status, "WhatsApp opened. Saving your enquiry...", whatsAppUrl);

    try {
      const result = await submitLeadToGoogleSheet(lead);

      if (result.ok) {
        setFormStatus(status, "Thank you. Your enquiry has been received.", whatsAppUrl);
        form.reset();
        captureUtmFields(form);
        return;
      }

      setFormStatus(status, "WhatsApp opened. Please send the enquiry there.", whatsAppUrl);
    } catch (error) {
      setFormStatus(status, "WhatsApp opened. Please send the enquiry there.", whatsAppUrl);
    }
  });
}

function setupFooterYear() {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
}

function init() {
  setupPlanSelector();
  setupTrackingLinks();
  setupLeadForm();
  setupFooterYear();
}

document.addEventListener("DOMContentLoaded", init);
