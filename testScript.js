async function getEvents()
{
    let fetchResult = await fetch("events.json");
    let parseResult = await fetchResult.json();

    let todayEvents = [];
    let upcomingEvents = [];
    
    let currentDateTime = new Date();
    for (let i = 0; i < parseResult.length; i += 1)
    {
        let thisEvent = parseResult[i];
        
        let thisDateTime = new Date(thisEvent.startTime);
        const eventGracePeriod = 8 * 60 * 60000; // 8 hours
        let irrelevancyThreshold = new Date(currentDateTime.getTime() - eventGracePeriod);
        const tomorrowGracePeriod = 24 * 60 * 60000; // 24 hours
        let todayThreshold = new Date(currentDateTime.getTime() + tomorrowGracePeriod);

        if (thisDateTime < irrelevancyThreshold)
        {
            // discard
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

async function buildPage()
{
    let events = await getEvents();

    let eventTable = document.getElementById("eventTableBody");

    for (let i = 0; i < events.today.length; i++)
    {
        let thisEvent = events.today[i];

        let newRow = document.createElement("tr");

        let newName = document.createElement("td");
        let newNameText = document.createTextNode(thisEvent.name);
        newName.appendChild(newNameText);
        newRow.appendChild(newName);

        let newStartTime = document.createElement("td");
        let newStartTimeText = document.createTextNode(thisEvent.startTime);
        newStartTime.appendChild(newStartTimeText);
        newRow.appendChild(newStartTime);

        let newDescription = document.createElement("td");
        let newDescriptionText = document.createTextNode(thisEvent.description);
        newDescription.appendChild(newDescriptionText);
        newRow.appendChild(newDescription);

        let newLink = document.createElement("td");
        let newLinkText = document.createTextNode(thisEvent.link);
        newLink.appendChild(newLinkText);
        newRow.appendChild(newLink);

        eventTable.appendChild(newRow);
    }
}

buildPage();
