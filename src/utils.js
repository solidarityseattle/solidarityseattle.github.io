// Date helpers
export function isValidDate(d) {
    return d instanceof Date && !isNaN(d);
}

export function isToday(eventDate, now) {
    return eventDate.toDateString() === now.toDateString();
}

// Determines if event happens during this week Monday - Sunday
export function isThisWeek(eventDate, now) {
    const currentDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Figure out how far back Monday is (0 = Sunday, 1 = Monday, ... 6 = Saturday)
    const dayOfWeek = currentDay.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7; // shift so Monday = 0

    const monday = new Date(
        currentDay.getFullYear(),
        currentDay.getMonth(),
        currentDay.getDate() - diffToMonday
    );

    const endOfWeek = new Date(
        monday.getFullYear(),
        monday.getMonth(),
        monday.getDate() + 7
    );

    return eventDate > currentDay && eventDate <= endOfWeek;
}

export function isThisMonth(eventDate, now) {
    const currentDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return eventDate > currentDay &&
        eventDate.getMonth() === now.getMonth() &&
        eventDate.getFullYear() === now.getFullYear();
}

// DOM helpers
export function createStrongText(label, value) {
    const span = document.createElement('span');
    const strong = document.createElement('strong');
    strong.textContent = `${label}: `;
    span.appendChild(strong);
    span.appendChild(document.createTextNode(value));
    return span;
}
