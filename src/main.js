import "./style.css";
import { fetchEvents } from "./events.js";
import { setupAdmin } from "./admin.js";

document.addEventListener("DOMContentLoaded", () => {
  const submitPopup = document.getElementById("submit-popup");
  const adminPopup = document.getElementById("admin-popup");

  document.getElementById("add-event-btn").addEventListener("click", () => {
    submitPopup.classList.remove("hidden");
  });

  document.getElementById("admin-login-btn").addEventListener("click", () => {
    adminPopup.classList.remove("hidden");
  });

  document.querySelectorAll(".close-popup").forEach((button) => {
    button.addEventListener("click", () => {
      submitPopup.classList.add("hidden");
      adminPopup.classList.add("hidden");
    });
  });

  document.addEventListener("eventSubmitted", () => {
    submitPopup.classList.add("hidden");
    showMessage("success-popup", "Event proposed successfully!");
  });

  document.addEventListener("eventApproved", () => {
    showMessage("success-popup", "Event approved successfully!");
  });

  document.addEventListener("appError", (event) => {
    showMessage("error-popup", event.detail.message);
  });

  function showMessage(elementId, message) {
    const element = document.getElementById(elementId);

    element.classList.remove("hidden");
    element.textContent = message;

    // Hide after 3 seconds
    setTimeout(() => {
      setTimeout(() => element.classList.add("hidden"), 400);
    }, 3000);
  }

  fetchEvents();
  setupAdmin();
});
