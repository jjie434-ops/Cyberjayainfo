const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const enquiryForm = document.querySelector(".enquiry-form");
const formStatus = document.querySelector("[data-form-status]");
const whatsappUrl = "https://wa.link/spjgoe";
const googleSheetEndpoint = "https://script.google.com/macros/s/AKfycbwx83wuJyEJOTo43UYszk6bYKta70SNpHrHVlvMTRJ0RRZq4pjbplGMoqqBqFkWpTDN/exec";

navToggle?.addEventListener("click", () => {
  const isOpen = siteNav.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

siteNav?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    siteNav.classList.remove("is-open");
    navToggle?.setAttribute("aria-expanded", "false");
  }
});

enquiryForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const submitButton = enquiryForm.querySelector("button[type='submit']");
  const formData = new FormData(enquiryForm);
  const leadData = {
    name: String(formData.get("name") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    size: String(formData.get("size") || "").trim(),
    source: "Myra Cove Website",
    submittedAt: new Date().toISOString()
  };

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.classList.add("is-loading");
  }
  if (formStatus) {
    formStatus.textContent = "Submitting your details...";
  }

  submitLead(leadData).finally(() => {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.classList.remove("is-loading");
    }
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  });
});

async function submitLead(leadData) {
  if (!googleSheetEndpoint) {
    if (formStatus) {
      formStatus.textContent = "WhatsApp will open now. Google Sheet storage is not connected yet.";
    }
    return;
  }

  try {
    await fetch(googleSheetEndpoint, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(leadData)
    });

    enquiryForm.reset();
    if (formStatus) {
      formStatus.textContent = "Thank you. Your details have been submitted.";
    }
  } catch (error) {
    if (formStatus) {
      formStatus.textContent = "Could not submit to Google Sheet, but WhatsApp will still open.";
    }
  }
}
