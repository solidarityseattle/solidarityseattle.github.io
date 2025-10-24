import {
  isValidDate,
  isToday,
  isThisWeek,
  isThisMonth,
  createStrongText,
} from "./utils.js";
import { eventsAPI, APIError } from "./api";

const API_URL = import.meta.env.VITE_API_URL;

export async function fetchEvents() {
  const loadingMessage = document.getElementById("loading-message");
  const errorMessage = document.getElementById("error-message");

  try {
    const events = await eventsAPI.getApproved();

    loadingMessage.classList.add("hidden");
    renderEvents(events);
  } catch (error) {
    loadingMessage.classList.add("hidden");
    errorMessage.classList.remove("hidden");

    document.dispatchEvent(
      new CustomEvent("appError", {
        detail: {
          message: error.message || "An Error Occurred! Please try again",
        },
      }),
    );
  }
}

function renderEvents(events) {
  const now = new Date();

  const todayList = document.querySelector(
    '.event-list[data-category="today"]',
  );
  const weekList = document.querySelector('.event-list[data-category="week"]');
  const monthList = document.querySelector(
    '.event-list[data-category="month"]',
  );

  todayList.innerHTML = "";
  weekList.innerHTML = "";
  monthList.innerHTML = "";

  // Sort events by date and time
  events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  events.forEach((event) => {
    const eventDate = new Date(event.timestamp);
    if (!isValidDate(eventDate)) {
      console.warn(`Invalid date for event "${event.title}". Skipping.`);
      return;
    }

    const li = createEventListItem(event, eventDate);

    if (isToday(eventDate, now)) todayList.appendChild(li);
    else if (isThisWeek(eventDate, now)) weekList.appendChild(li);
    else if (isThisMonth(eventDate, now)) monthList.appendChild(li);
  });
}

function createEventListItem(event, eventDate) {
  const li = document.createElement("li");
  li.className = "event-item";

  const h3 = document.createElement("h3");
  h3.className = "event-title";
  h3.textContent = event.title;
  li.appendChild(h3);

  const p = document.createElement("p");
  p.className = "event-details";

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(eventDate);
  const formattedTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(eventDate);

  p.appendChild(createStrongText("Date", formattedDate));
  p.appendChild(document.createElement("br"));
  p.appendChild(createStrongText("Time", formattedTime));
  p.appendChild(document.createElement("br"));
  p.appendChild(createStrongText("Location", event.location));
  p.appendChild(document.createElement("br"));
  p.appendChild(document.createElement("br"));
  p.appendChild(document.createTextNode(event.description));

  li.appendChild(p);

  return li;
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("submit-event-form");
  if (!form) return; // Safety check in case this script runs on pages without the form

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const eventData = {
      title: sanitizeInput(formData.get("title")),
      date: sanitizeInput(formData.get("date")),
      time: sanitizeInput(formData.get("time")),
      location: sanitizeInput(formData.get("location")),
      description: sanitizeInput(formData.get("description")),
    };

    try {
      await eventsAPI.create(eventData);

      e.target.reset();
      document.dispatchEvent(new CustomEvent("eventSubmitted"));
      fetchEvents();
    } catch (error) {
      document.dispatchEvent(
        new CustomEvent("appError", {
          detail: {
            message: error.message || "An Error Occurred! Please try again",
          },
        }),
      );
    }
  });
});

function sanitizeInput(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
