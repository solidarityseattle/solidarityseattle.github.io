// Obscure!! (maybe?)
const SPREADSHEET_API_URL = 'https://script.google.com/macros/s/AKfycbyS0Cf1ujaoaHz7TAJjD3ybzfh85lzg03l89xapPSSAzgI0BWLjdBriNnmjtB8vmmdfLg/exec';

document.addEventListener('DOMContentLoaded', () => {
    fetchEvents();
});

async function fetchEvents() {
    const loadingMessage = document.getElementById('loading-message');
    const errorMessage = document.getElementById('error-message');

    try {
        const response = await fetch(SPREADSHEET_API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const events = await response.json();

        loadingMessage.classList.add('hidden');
        renderEvents(events);

    } catch (error) {
        console.error('Could not fetch events:', error);
        loadingMessage.classList.add('hidden');
        errorMessage.classList.remove('hidden');
    }
}

function renderEvents(events) {
    const now = new Date();

    const todayList = document.querySelector('.event-list[data-category="today"]');
    const weekList = document.querySelector('.event-list[data-category="week"]');
    const monthList = document.querySelector('.event-list[data-category="month"]');

    todayList.innerHTML = '';
    weekList.innerHTML = '';
    monthList.innerHTML = '';

    // Sort events by date
    //TODO: Sort by time too so events on same day will be correctly ordered
    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    events.forEach(event => {

        const eventDate = new Date(event.date);

        if (!isValidDate(eventDate)) {
            console.warn(`Invalid date for event "${event.event_name}". Skipping.`);
            return;
        }

        const li = createEventListItem(event, eventDate);

        // Check if the event falls into "today", "this week", or "this month"
        if (isToday(eventDate, now)) {
            todayList.appendChild(li);
        } else if (isThisWeek(eventDate, now)) {
            weekList.appendChild(li);
        } else if (isThisMonth(eventDate, now)) {
            monthList.appendChild(li);
        }
    });
}

// Function to create the full list item (pretty verbose but imp to avoid XSS)
const createEventListItem = (event, eventDate) => {
    const li = document.createElement('li');
    li.className = 'event-item';

    // Create the title
    const h3 = document.createElement('h3');
    h3.className = 'event-title';
    h3.textContent = event.event_name;
    li.appendChild(h3);

    // Create the details paragraph
    const p = document.createElement('p');
    p.className = 'event-details';

    // Append date, location, and description
    p.appendChild(createStrongText('Date', `${eventDate.toLocaleDateString()} at ${event.time}`));
    p.appendChild(document.createElement('br'));
    p.appendChild(createStrongText('Location', event.location));
    p.appendChild(document.createElement('br'));
    p.appendChild(document.createTextNode(event.description));
    p.appendChild(document.createElement('br'));

    // Create and append the link if a link is provided
    if (event.link) {
        const linkSpan = document.createElement('span');
        const linkStrong = document.createElement('strong');
        linkStrong.textContent = 'Link: ';
        linkSpan.appendChild(linkStrong);

        const link = document.createElement('a');
        link.href = event.link;
        link.textContent = event.link;
        link.target = "_blank";
        linkSpan.appendChild(link);

        p.appendChild(linkSpan);
    }

    li.appendChild(p);

    // Return the complete list item
    return li;
};

// Function to create a strong text element
const createStrongText = (label, value) => {
    const span = document.createElement('span');
    const strong = document.createElement('strong');
    strong.textContent = `${label}: `;
    span.appendChild(strong);
    span.appendChild(document.createTextNode(value));
    return span;
};

function isValidDate(d) {
    return d instanceof Date && !isNaN(d);
}

//TODO: test dates more!!
function isToday(eventDate, now) {
    return eventDate.toDateString() === now.toDateString();
}

function isThisWeek(eventDate, now) {
    const currentDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastDayOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 6);

    return eventDate > currentDay && eventDate <= lastDayOfWeek;
}

function isThisMonth(eventDate, now) {
    const currentDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return eventDate > currentDay && eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
}