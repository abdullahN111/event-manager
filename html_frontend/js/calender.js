let currentDate = new Date();
let selectedDate = new Date();
let hideTimer;


function formatTime(time24) {
  const [hour, minute] = time24.split(":").map(Number);

  const period = hour >= 12 ? "PM" : "AM";

  const h = hour % 12 || 12;

  return `${h}:${minute.toString().padStart(2, "0")} ${period}`;
}

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function renderCalendar(events) {
  const monthYear = document.getElementById("monthYear");
  const weekdaysContainer = document.getElementById("weekdays");
  const calendarGrid = document.getElementById("calendarGrid");

  monthYear.textContent = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  weekdaysContainer.innerHTML = "";
  weekdays.forEach((day) => {
    weekdaysContainer.innerHTML += `
            <div class="text-center text-sm font-medium text-gray-500 py-1">
                ${day}
            </div>
        `;
  });

  calendarGrid.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const firstDayIndex = firstDay.getDay();

  for (let i = 0; i < firstDayIndex; i++) {
    calendarGrid.innerHTML += `<div class="h-32"></div>`;
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day);

    const dayEvents = getEventsForDate(date, events);

    const today = isToday(date);
    const selected = isSelected(date);

    let eventHTML = "";

    dayEvents.slice(0, 2).forEach((event) => {
      eventHTML += `
                <div
                    class="text-xs p-1 rounded truncate ${selected
          ? "bg-white text-[#e91e63]"
          : "bg-[#e91e63] text-white"
        }"
                >
                    ${event.eventName}
                </div>
            `;
    });

    if (dayEvents.length > 2) {
      eventHTML += `
                <div class="text-xs ${selected ? "text-white" : "text-gray-500"
        }">
                    +${dayEvents.length - 2} more
                </div>
            `;
    }

    calendarGrid.innerHTML += `
            <div
                class="calendar-day h-32 p-2 border rounded-lg cursor-pointer transition-colors overflow-hidden
                ${today ? "bg-blue-50 border-blue-200" : "border-gray-200"}
                ${selected
        ? "bg-[#e91e63] text-white"
        : "bg-white hover:bg-gray-50"
      }"

                data-date="${date.toISOString()}"

            >

                <div class="flex justify-between items-start">

                    <span class="${selected ? "text-gray-500" : "text-gray-700"
      } font-medium">

                        ${day}

                    </span>

                    ${dayEvents.length
        ? `
                        <span class="
                            w-5
                            h-5
                            rounded-full
                            text-xs
                            flex
                            items-center
                            justify-center
                            ${selected
          ? "bg-white text-[#e91e63]"
          : "bg-[#e91e63] text-white"
        }
                        ">
                            ${dayEvents.length}
                        </span>
                    `
        : ""
      }

                </div>

                <div class="mt-1 space-y-1">

                    ${eventHTML}

                </div>

            </div>
        `;
  }

  attachCalendarEvents(events);

  renderSelectedEvents(events);
}

function attachCalendarEvents(events) {
  document.querySelectorAll(".calendar-day").forEach((day) => {
    const date = new Date(day.dataset.date);

    day.addEventListener("click", () => {
      selectedDate = date;

      renderCalendar(events);
    });

    day.addEventListener("mouseenter", () => {
      clearTimeout(hideTimer);
      showPopover(day, date, getEventsForDate(date, events));
    });

    day.addEventListener("mouseleave", () => {
      hideTimer = setTimeout(hidePopover, 50);
    });
  });

  document.getElementById("prevMonth").onclick = () => {
    currentDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1,
    );

    renderCalendar(events);
  };

  document.getElementById("nextMonth").onclick = () => {
    currentDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      1,
    );

    renderCalendar(events);
  };
}

function getEventsForDate(date, events) {
  return events.filter((event) => {
    const d = new Date(event.eventDate);

    return (
      d.getDate() === date.getDate() &&
      d.getMonth() === date.getMonth() &&
      d.getFullYear() === date.getFullYear()
    );
  });
}

function isToday(date) {
  const today = new Date();

  return (
    today.getDate() === date.getDate() &&
    today.getMonth() === date.getMonth() &&
    today.getFullYear() === date.getFullYear()
  );
}

function isSelected(date) {
  return (
    selectedDate.getDate() === date.getDate() &&
    selectedDate.getMonth() === date.getMonth() &&
    selectedDate.getFullYear() === date.getFullYear()
  );
}

function renderSelectedEvents(events) {
  const container = document.getElementById("selectedEvents");

  const dayEvents = getEventsForDate(selectedDate, events);

  container.innerHTML = `
        <div class="mt-6 p-4 bg-gray-50 rounded-lg">

            <h3 class="text-lg font-medium text-gray-800 mb-3">

                Events on

                ${selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })}

            </h3>

        </div>
    `;

  if (!dayEvents.length) {
    container.innerHTML += `
            <div class="text-center py-8 text-gray-500 border rounded-lg">

                No events scheduled for this date.

            </div>
        `;

    return;
  }

  let html = `<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">`;

  dayEvents.forEach((event) => {
    html += `

            <div class="relative p-4 rounded-xl border shadow bg-white">

                <div class="absolute top-3 right-3 px-2 py-1 text-xs bg-pink-100 text-pink-600 rounded-full">

                    ${formatTime(event.time.start)} - ${formatTime(event.time.end)}

                </div>

                <h4 class="font-semibold text-lg">

                    ${event.eventName}

                </h4>

                <p><b>Customer:</b> ${event.customer.name}</p>

                <p><b>Phone:</b> ${event.customer.phone}</p>

            </div>

        `;
  });

  html += "</div>";

  container.innerHTML += html;
}

const pop = document.getElementById("datePopover");

pop.addEventListener("mouseenter", () => {
  clearTimeout(hideTimer);
});

pop.addEventListener("mouseleave", () => {
  hideTimer = setTimeout(hidePopover, 50);
});
