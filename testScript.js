const TEST_DATETIME = new Date("2025-05-10T12:00:00.000-07:00")

async function getEvents(currentDateTime)
{
    const fetchResult = await fetch("testEvents.json");
    const parseResult = await fetchResult.json();

    const todayEvents = [];
    const upcomingEvents = [];

    for (let i = 0; i < parseResult.length; i++)
    {
        const thisEvent = parseResult[i];
        
        const thisDateTime = new Date(thisEvent.startTime);

        const eventGracePeriod = 8 * 60 * 60000; // 8 hours
        const irrelevancyThreshold = new Date(currentDateTime.getTime() - eventGracePeriod);

        const tomorrowGracePeriod = 24 * 60 * 60000; // 24 hours
        const todayThreshold = new Date(currentDateTime.getTime() + tomorrowGracePeriod);

        if (thisDateTime < irrelevancyThreshold) {
            // discard
            continue;
        }
        else if (thisDateTime < todayThreshold)
        {
            todayEvents.push(thisEvent);
        }
        else
        {
            upcomingEvents.push(thisEvent);
        }
    }

    return {
        today: todayEvents,
        upcoming: upcomingEvents,
    };
}

function appendEvent(parent, eventDetails)
{
    const eventDiv = document.createElement("div");
    eventDiv.classList.add("event");

    const name = document.createElement("h2");
    name.textContent = eventDetails.name;
    eventDiv.appendChild(name);

    const date = document.createElement("div");
    date.classList.add("date");
    date.textContent = new Date(eventDetails.startTime);
    eventDiv.appendChild(date);

    const location = document.createElement("div");
    location.classList.add("location");
    location.textContent = eventDetails.location;
    eventDiv.appendChild(location);

    const desc = document.createElement("p");
    desc.textContent = eventDetails.description;
    eventDiv.appendChild(desc);

    const link = document.createElement("div");
    link.classList.add("link");
    eventDiv.appendChild(link);
    const linkHref = document.createElement("a");
    linkHref.href = eventDetails.link;
    linkHref.textContent = eventDetails.link;
    link.appendChild(linkHref);

    parent.appendChild(eventDiv);
}

function appendEvents(sectionId, eventDetails)
{
    const section = document.getElementById(sectionId);
    const sectionEvents = section.getElementsByClassName("events")[0];

    for (let i = 0; i < eventDetails[sectionId].length; i++)
    {
        appendEvent(sectionEvents, eventDetails[sectionId][i]);
    }
}

async function buildPage(currentDateTime)
{
    const events = await getEvents(currentDateTime);

    appendEvents("today", events);
    appendEvents("upcoming", events);
}

buildPage(TEST_DATETIME);
