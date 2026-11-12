function formatTime(time24) {
  if (!time24) return "";
  const [hour, minute] = time24.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  return `${h}:${minute.toString().padStart(2, "0")} ${period}`;
}

function showPopover(target, date, events) {
  if (!events.length) return;

  const pop = document.getElementById("datePopover");
  if (!pop) return;

  let html = `
    <h3 class="text-sm font-bold text-gray-800 mb-2 pb-2 border-b border-gray-100">
      Bookings on
      ${date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })}
    </h3>
  `;

  events.forEach((event) => {
    html += `
      <a href="event-details.html?id=${event.id}" class="block group">
        <div class="mb-2 p-2.5 bg-gray-50 group-hover:bg-gray-100 rounded-lg transition-colors border border-gray-100">
          <h4 class="font-semibold text-sm text-theme">${event.eventName}</h4>

          <p class="text-xs text-gray-600 mt-1">
            <b>Time:</b>
            ${formatTime(event.time.start)} - ${formatTime(event.time.end)}
          </p>

          <p class="text-xs text-gray-600">
            <b>Customer:</b>
            ${event.customer.name} (${event.customer.phone})
          </p>
        </div>
      </a>
    `;
  });

  pop.innerHTML = html;
  pop.classList.remove("hidden");

  const rect = target.getBoundingClientRect();
  const popRect = pop.getBoundingClientRect();

  let left = rect.left + window.scrollX;
  let top = rect.bottom + window.scrollY + 10;

  if (left + popRect.width > window.innerWidth + window.scrollX) {
    left = window.innerWidth + window.scrollX - popRect.width - 10;
  }

  if (top + popRect.height > window.innerHeight + window.scrollY) {
    top = rect.top + window.scrollY - popRect.height - 10;
  }

  if (left < 10) left = 10;
  if (top < 10) top = 10;

  pop.style.left = left + "px";
  pop.style.top = top + "px";
}

function hidePopover() {
  const pop = document.getElementById("datePopover");
  if (pop) {
    pop.classList.add("hidden");
  }
}
