const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const enquiryForm = document.querySelector(".enquiry-form");
const whatsappUrl = "https://wa.link/spjgoe";

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

  window.open(whatsappUrl, "_blank", "noopener,noreferrer");
});
