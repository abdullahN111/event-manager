let currentDate = new Date();
let selectedDate = new Date();
let hideTimer;

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatTime(time24) {
  if (!time24) return "";
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

  if (!monthYear || !weekdaysContainer || !calendarGrid) return;

  monthYear.textContent = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  weekdaysContainer.innerHTML = "";
  weekdays.forEach((day) => {
    weekdaysContainer.innerHTML += `
      <div class="text-center text-xs sm:text-sm font-semibold text-gray-500 py-1">
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
    calendarGrid.innerHTML += `<div class="h-28 sm:h-32 bg-gray-50/50 rounded-lg border border-transparent"></div>`;
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day);
    const dateKey = formatDateKey(date);

    const dayEvents = getEventsForDate(date, events);

    const today = isToday(date);
    const selected = isSelected(date);

    let eventHTML = "";

    dayEvents.slice(0, 2).forEach((event) => {
      const isCancelled = event.status === "Cancelled";
      eventHTML += `
        <div
          class="text-xs px-1.5 py-0.5 rounded truncate font-medium ${
            selected
              ? "bg-white text-theme"
              : isCancelled
                ? "bg-gray-200 text-gray-500 line-through"
                : "bg-theme text-white"
          }"
        >
          ${event.eventName}
        </div>
      `;
    });

    if (dayEvents.length > 2) {
      eventHTML += `
        <div class="text-xs font-medium ${
          selected ? "text-white/90" : "text-gray-500"
        }">
          +${dayEvents.length - 2} more
        </div>
      `;
    }

    calendarGrid.innerHTML += `
      <div
        class="calendar-day h-28 sm:h-32 p-2 border rounded-lg cursor-pointer transition-all overflow-hidden
        ${
          selected
            ? "bg-theme text-white border-theme shadow-sm"
            : today
              ? "bg-blue-50/70 border-blue-300 hover:bg-blue-50"
              : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
        }"
        data-date="${dateKey}"
      >
        <div class="flex justify-between items-start">
          <span class="text-sm font-semibold ${
            selected
              ? "text-white"
              : today
                ? "text-blue-700"
                : "text-gray-700"
          }">
            ${day}
            ${
              today && !selected
                ? `<span class="text-[10px] font-normal text-blue-600 ml-0.5">(Today)</span>`
                : ""
            }
          </span>

          ${
            dayEvents.length
              ? `
              <span class="
                w-5 h-5 rounded-full text-xs font-semibold flex items-center justify-center
                ${selected ? "bg-white text-theme" : "bg-theme text-white"}
              ">
                ${dayEvents.length}
              </span>
            `
              : ""
          }
        </div>

        <div class="mt-1.5 space-y-1">
          ${eventHTML}
        </div>
      </div>
    `;
  }

  attachCalendarEvents(events);
  renderSelectedEvents(events);
}

function attachCalendarEvents(events) {
  document.querySelectorAll(".calendar-day").forEach((dayEl) => {
    const [y, m, d] = dayEl.dataset.date.split("-").map(Number);
    const date = new Date(y, m - 1, d);

    dayEl.addEventListener("click", () => {
      selectedDate = date;
      renderCalendar(events);
    });

    dayEl.addEventListener("mouseenter", () => {
      clearTimeout(hideTimer);
      showPopover(dayEl, date, getEventsForDate(date, events));
    });

    dayEl.addEventListener("mouseleave", () => {
      hideTimer = setTimeout(hidePopover, 50);
    });
  });

  const prevBtn = document.getElementById("prevMonth");
  const nextBtn = document.getElementById("nextMonth");
  const todayBtn = document.getElementById("todayBtn");

  if (prevBtn) {
    prevBtn.onclick = () => {
      currentDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1
      );
      renderCalendar(events);
    };
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      currentDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1
      );
      renderCalendar(events);
    };
  }

  if (todayBtn) {
    todayBtn.onclick = () => {
      const now = new Date();
      currentDate = new Date(now.getFullYear(), now.getMonth(), 1);
      selectedDate = now;
      renderCalendar(events);
    };
  }
}

function getEventsForDate(date, events) {
  const targetKey = formatDateKey(date);
  return events.filter((event) => event.eventDate === targetKey);
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
  if (!container) return;

  const dayEvents = getEventsForDate(selectedDate, events);
  const selectedDateKey = formatDateKey(selectedDate);
  const formattedDateHeading = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  let html = `
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div class="flex flex-wrap justify-between items-center gap-3 mb-4">
        <div>
          <h3 class="text-lg font-semibold text-gray-800">
            Schedule for ${formattedDateHeading}
          </h3>
          <p class="text-xs text-gray-500">
            ${
              dayEvents.length
                ? `${dayEvents.length} booking(s) on this date`
                : "Hall is currently free on this date"
            }
          </p>
        </div>

        <button
          type="button"
          onclick="openNewEventForDate('${selectedDateKey}')"
          class="px-3.5 py-2 text-xs font-medium btn-theme rounded-lg shadow-sm cursor-pointer"
        >
          + Book This Date
        </button>
      </div>
  `;

  if (!dayEvents.length) {
    html += `
      <div class="text-center py-6 bg-gray-50 text-gray-500 border border-dashed border-gray-200 rounded-lg text-sm">
        No events scheduled for this date. Click <b>+ Book This Date</b> to add a booking.
      </div>
    </div>`;
    container.innerHTML = html;
    return;
  }

  html += `<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">`;

  dayEvents.forEach((event) => {
    const remaining = Math.max(
      0,
      Number(event.finance?.requestedAmount ?? 0) -
        Number(event.finance?.totalPaid ?? 0)
    );

    html += `
      <div class="relative p-4 rounded-xl border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow flex flex-col justify-between">
        <div>
          <div class="flex justify-between items-start gap-2 mb-2">
            <h4 class="font-bold text-gray-800 text-base">
              ${event.eventName}
            </h4>
            <span class="px-2.5 py-0.5 text-xs font-semibold badge-theme rounded-full whitespace-nowrap">
              ${formatTime(event.time.start)} - ${formatTime(event.time.end)}
            </span>
          </div>

          <div class="space-y-1 text-sm text-gray-600 mt-2">
            <p><strong class="text-gray-700">Customer:</strong> ${event.customer.name}</p>
            <p><strong class="text-gray-700">Phone:</strong> ${event.customer.phone}</p>
            <p>
              <strong class="text-gray-700">Balance:</strong>
              ${
                remaining > 0
                  ? `<span class="text-red-600 font-medium">Rs. ${remaining.toLocaleString("en-PK")} due</span>`
                  : `<span class="text-green-600 font-medium">Fully Paid</span>`
              }
            </p>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
          <a
            href="edit-event.html?id=${event.id}"
            class="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md"
          >
            Edit
          </a>
          <a
            href="event-details.html?id=${event.id}"
            class="px-3 py-1 text-xs font-medium btn-theme rounded-md"
          >
            View Details
          </a>
        </div>
      </div>
    `;
  });

  html += `</div></div>`;
  container.innerHTML = html;
}

function openNewEventForDate(dateStr) {
  const modal = document.getElementById("eventModal");
  const eventDateInput = document.getElementById("eventDate");
  const bookingDateInput = document.getElementById("bookingDate");
  const eventForm = document.getElementById("eventForm");
  const remaining = document.getElementById("confirmedAmount");
  const feedback = document.getElementById("availabilityFeedback");

  if (!modal) return;

  if (eventForm) eventForm.reset();
  if (remaining) remaining.value = "";
  if (feedback) feedback.classList.add("hidden");

  if (bookingDateInput) {
    bookingDateInput.value = formatDateKey(new Date());
  }
  if (eventDateInput && dateStr) {
    eventDateInput.value = dateStr;
  }

  modal.classList.remove("hidden");
}

const pop = document.getElementById("datePopover");
if (pop) {
  pop.addEventListener("mouseenter", () => {
    clearTimeout(hideTimer);
  });

  pop.addEventListener("mouseleave", () => {
    hideTimer = setTimeout(hidePopover, 50);
  });
}
