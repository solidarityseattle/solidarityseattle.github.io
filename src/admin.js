import { adminAPI, APIError } from "./api";

const API_URL = import.meta.env.VITE_API_URL;

export function setupAdmin() {
  const adminPopup = document.getElementById("admin-popup");
  const errorMsg = document.getElementById("admin-login-error");
  const adminInput = document.getElementById("admin-input");

  document
    .getElementById("admin-login-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const password = e.target.password.value.trim();

      try {
        await adminAPI.login(password);

        adminPopup.classList.add("hidden");
        errorMsg.classList.add("hidden");
        loadAdminView();
      } catch (error) {
        // Handle different error types
        adminInput.value = "";

        if (error instanceof APIError) {
          if (error.status === 401) {
            errorMsg.textContent = "Incorrect password. Please try again.";
          } else if (error.status === 0) {
            // Network error
            errorMsg.textContent =
              "Could not connect to the server. Please try again later.";
          } else {
            errorMsg.textContent =
              "An error occurred during login. Please try again later.";
          }
        } else {
          // Unexpected error
          errorMsg.textContent =
            "An unexpected error occurred. Please try again later.";
        }

        errorMsg.classList.remove("hidden");
      }
    });
}

async function loadAdminView() {
  try {
    const events = await adminAPI.getEvents();

    // Sort events by date and time
    events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const main = document.querySelector("main");
    main.innerHTML =
      '<h2>Admin Event Management</h2><ul id="admin-event-list"></ul>';

    const list = document.getElementById("admin-event-list");
    events.forEach((event) => {
      const isApproved = event.approved;
      const li = createAdminEventListItem(event, isApproved);

      list.appendChild(li);
    });

    const backBtn = document.createElement("button");
    backBtn.textContent = "Return to Main Page";
    backBtn.className = "return-button";

    backBtn.addEventListener("click", () => {
      window.location.reload();
    });

    main.appendChild(backBtn);
  } catch (error) {
    if (error instanceof APIError) {
      // Handle authentication errors
      if (error.status === 401 || error.status === 403) {
        try {
          await adminAPI.logout(); // Clear any expired cookie
        } catch {
          // Ignore logout errors
        }
        window.location.reload();
        return;
      }
    }
    document.dispatchEvent(
      new CustomEvent("appError", {
        detail: {
          message: error.message || "An Error Occurred! Please try again",
        },
      }),
    );
  }
}

function createAdminEventListItem(event, isApproved) {
  const li = document.createElement("li");
  li.className = "event-item";

  // Event title
  const h3 = document.createElement("h3");
  h3.textContent = event.title;
  li.appendChild(h3);

  // Event date & location summary
  const summary = document.createElement("p");
  const eventDate = new Date(event.timestamp);
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  summary.textContent = `${formattedDate} — ${event.location}`;
  li.appendChild(summary);

  // Hidden description area
  const desc = document.createElement("p");
  desc.textContent = event.description;
  desc.classList.add("hidden", "event-description"); // hide by default
  li.appendChild(desc);

  // Buttons container
  const btnContainer = document.createElement("div");
  btnContainer.className = "admin-controls";

  const showBtn = document.createElement("button");
  showBtn.textContent = "Show Description";
  btnContainer.appendChild(showBtn);

  if (!isApproved) {
    const approveBtn = document.createElement("button");
    approveBtn.textContent = "Approve Event";
    btnContainer.appendChild(approveBtn);

    approveBtn.addEventListener("click", async () => {
      const confirmed = await showConfirm(`Approve event "${event.title}"?`);
      if (!confirmed) return;

      try {
        await adminAPI.approveEvent(event._id);

        approveBtn.remove();
        document.dispatchEvent(new CustomEvent("eventApproved"));
      } catch {
        document.dispatchEvent(
          new CustomEvent("appError", {
            detail: {
              message: error.message || "An Error Occurred! Please try again",
            },
          }),
        );
      }
    });
  }

  const delBtn = document.createElement("button");
  delBtn.textContent = "Delete";
  btnContainer.appendChild(delBtn);

  li.appendChild(btnContainer);

  // --- Logic: toggle description visibility ---
  showBtn.addEventListener("click", () => {
    const isHidden = desc.classList.contains("hidden");
    if (isHidden) {
      desc.classList.remove("hidden");
      showBtn.textContent = "Hide Description";
    } else {
      desc.classList.add("hidden");
      showBtn.textContent = "Show Description";
    }
  });

  // --- Logic: delete event ---
  delBtn.addEventListener("click", async () => {
    const confirmed = await showConfirm(`Delete event "${event.title}"?`);
    if (!confirmed) return;

    try {
      await adminAPI.deleteEvent(event._id);
      li.remove();
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

  return li;
}

function showConfirm(message) {
  return new Promise((resolve) => {
    const popup = document.getElementById("confirm-popup");
    const msgEl = document.getElementById("confirm-message");
    const okBtn = document.getElementById("confirm-ok");
    const cancelBtn = document.getElementById("confirm-cancel");

    msgEl.textContent = message;
    popup.classList.remove("hidden");

    okBtn.addEventListener(
      "click",
      () => {
        popup.classList.add("hidden");
        resolve(true);
      },
      { once: true },
    );

    cancelBtn.addEventListener(
      "click",
      () => {
        popup.classList.add("hidden");
        resolve(false);
      },
      { once: true },
    );
  });
}
