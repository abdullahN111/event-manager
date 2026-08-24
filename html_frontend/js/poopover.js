function formatTime(time24) {
  const [hour, minute] = time24.split(":").map(Number);

  const period = hour >= 12 ? "PM" : "AM";

  const h = hour % 12 || 12;

  return `${h}:${minute.toString().padStart(2, "0")} ${period}`;
}


function showPopover(target, date, events) {
  if (!events.length) return;

  const pop = document.getElementById("datePopover");

  let html = `
    <h3 class="text-lg font-medium mb-3">
      Events on
      ${date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })}
    </h3>
  `;

  events.forEach((event) => {
    html += `
      <a href="event-details.html?id=${event.id}" class="block">
      <div class="mb-3 p-3 bg-gray-50 rounded">
        <h4 class="font-semibold">${event.eventName}</h4>

        <p class="text-sm">
          <b>Time:</b>
          ${formatTime(event.time.start)} - ${formatTime(event.time.end)}
        </p>

        <p class="text-sm">
          <b>Customer:</b>
          ${event.customer.name}
        </p>

        <p class="text-sm">
          <b>Phone:</b>
          ${event.customer.phone}
        </p>

        <p class="text-sm">
          <b>Status:</b>
          ${event.status}
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

  if (left < 10) {
    left = 10;
  }

  if (top < 10) {
    top = 10;
  }

  pop.style.left = left + "px";
  pop.style.top = top + "px";
}

function hidePopover() {
  document.getElementById("datePopover").classList.add("hidden");
}
