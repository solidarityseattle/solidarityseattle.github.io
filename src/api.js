const API_URL = import.meta.env.VITE_API_URL;

/**
 * Custom error class for API errors
 */
export class APIError extends Error {
  constructor(message, status, response) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.response = response;
  }
}

/**
 * Base request function - handles all common fetch logic
 */
async function request(endpoint, options = {}) {
  const config = {
    credentials: "include", // Always send cookies
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);

    // Handle common error cases
    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // Response wasn't JSON, use default message
      }

      throw new APIError(errorMessage, response.status, response);
    }

    return response;
  } catch (error) {
    // Network errors, etc.
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError("Network error: Could not connect to server", 0, null);
  }
}

/**
 * Admin authentication and operations API
 */
export const adminAPI = {
  /**
   * Login as admin
   * @param {string} password - Admin password
   * @returns {Promise<Response>}
   */
  async login(password) {
    return request("/admin/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
  },

  /**
   * Logout admin
   * @returns {Promise<Response>}
   */
  async logout() {
    return request("/admin/logout", {
      method: "POST",
    });
  },

  /**
   * Get all events (admin view - includes unapproved)
   * @returns {Promise<Array>}
   */
  async getEvents() {
    const response = await request("/admin/events");
    return response.json();
  },

  /**
   * Approve an event
   * @param {string} eventId - Event ID to approve
   * @returns {Promise<Response>}
   */
  async approveEvent(eventId) {
    return request(`/events/${eventId}/approve`, {
      method: "PATCH",
    });
  },

  /**
   * Delete an event
   * @param {string} eventId - Event ID to delete
   * @returns {Promise<Response>}
   */
  async deleteEvent(eventId) {
    return request(`/events/${eventId}`, {
      method: "DELETE",
    });
  },
};

/**
 * Public events API
 */
export const eventsAPI = {
  /**
   * Get all approved events
   * @returns {Promise<Array>}
   */
  async getApproved() {
    const response = await request("/events");
    return response.json();
  },

  /**
   * Submit a new event for approval
   * @param {Object} eventData - Event data
   * @param {string} eventData.title - Event title
   * @param {string} eventData.date - Event date
   * @param {string} eventData.time - Event time
   * @param {string} eventData.location - Event location
   * @param {string} eventData.description - Event description
   * @returns {Promise<Object>}
   */
  async create(eventData) {
    const response = await request("/add", {
      method: "POST",
      body: JSON.stringify(eventData),
    });
    return response.json();
  },
};
