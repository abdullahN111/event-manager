function parseLocalDate(dateStr) {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function getDynamicStatus(event) {
  if (event.status === "Cancelled") return "Cancelled";
  if (event.status === "Completed") return "Completed";

  const now = new Date();
  const eventDate = parseLocalDate(event.eventDate);

  const start = new Date(eventDate);
  const end = new Date(eventDate);

  const [sh, sm] = (event.startTime || "00:00").split(":").map(Number);
  const [eh, em] = (event.endTime || "23:59").split(":").map(Number);

  start.setHours(sh, sm, 0, 0);
  end.setHours(eh, em, 0, 0);

  if (now < start) return "Upcoming";
  if (now >= start && now <= end) return "In Progress";
  return "Completed";
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return parseLocalDate(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(time24) {
  if (!time24) return "";
  const [hour, minute] = time24.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  return `${h}:${minute.toString().padStart(2, "0")} ${period}`;
}

function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return "Rs. " + num.toLocaleString("en-PK");
}

document.addEventListener("DOMContentLoaded", loadEventDetails);

async function loadEventDetails() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    document.getElementById("eventContainer").innerHTML = `
      <p class="text-center text-red-500 font-medium">
        Event ID not found.
      </p>
    `;
    return;
  }

  try {
    const response = await fetch(
      `../backend/get_event.php?id=${id}`
    );

    const data = await response.json();

    if (data.status !== "success") {
      document.getElementById("eventContainer").innerHTML = `
        <p class="text-center text-red-500 font-medium">
          ${data.message}
        </p>
      `;
      return;
    }

    const event = data.data;
    document.title = `${event.eventName} (${event.eventDate}) – Events Manager`;

    const currentStatus = getDynamicStatus(event);

    const statusColor =
      currentStatus === "Upcoming"
        ? "bg-blue-100 text-blue-700"
        : currentStatus === "In Progress"
          ? "bg-green-100 text-green-700"
          : currentStatus === "Completed"
            ? "bg-gray-200 text-gray-700"
            : currentStatus === "Cancelled"
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-700";

    const container = document.getElementById("eventContainer");
    if (!container) return;

    const emailDisplay =
      event.customer.email && event.customer.email.trim() !== ""
        ? event.customer.email
        : "<span class='text-gray-400 italic'>Not provided</span>";

    container.innerHTML = `
      <div class="max-w-4xl mx-auto">
        <div class="mb-4 no-print">
          <a
            href="events.html"
            class="inline-flex items-center text-sm font-medium text-gray-600 hover-text-theme"
          >
            &larr; Back to All Events
          </a>
        </div>

        <div class="bg-white rounded-2xl shadow-md p-8 border border-gray-200">
          <!-- Header with Logo & Status -->
          <div class="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-gray-200">
            <div class="flex items-center gap-3">
              <img
                src="assets/logo.png"
                alt="Hall Logo"
                class="w-12 h-12 rounded-full object-cover border border-gray-200"
              />
              <div>
                <p class="text-xs font-semibold uppercase tracking-wider text-theme">
                  Events Manager – Booking Slip #${event.id}
                </p>
                <h1 class="text-2xl sm:text-3xl font-bold text-gray-800">
                  ${event.eventName}
                </h1>
              </div>
            </div>

            <span class="px-4 py-1.5 text-sm rounded-full font-semibold capitalize ${statusColor}">
              ${currentStatus}
            </span>
          </div>

          <!-- Event Schedule Details -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 py-5 border-b border-gray-100 text-sm">
            <div>
              <p class="text-gray-500 text-xs uppercase font-medium">Event Date</p>
              <p class="font-semibold text-gray-800 mt-0.5">${formatDate(event.eventDate)}</p>
            </div>

            <div>
              <p class="text-gray-500 text-xs uppercase font-medium">Event Timing</p>
              <p class="font-semibold text-gray-800 mt-0.5">
                ${formatTime(event.startTime)} – ${formatTime(event.endTime)}
              </p>
            </div>

            <div>
              <p class="text-gray-500 text-xs uppercase font-medium">Booking Date</p>
              <p class="font-semibold text-gray-800 mt-0.5">${formatDate(event.bookingDate)}</p>
            </div>
          </div>

          <!-- Customer Info -->
          <section class="py-6 border-b border-gray-100">
            <h2 class="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span class="w-1.5 h-5 bg-theme rounded-full"></span>
              Customer Information
            </h2>

            <div class="grid md:grid-cols-3 gap-4 text-sm text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p>
                <strong class="block text-xs text-gray-500 uppercase">Customer Name</strong>
                <span class="font-semibold text-gray-800 text-base">${event.customer.name}</span>
              </p>

              <p>
                <strong class="block text-xs text-gray-500 uppercase">Phone Number</strong>
                <span class="font-semibold text-gray-800 text-base">${event.customer.phone}</span>
              </p>

              <p>
                <strong class="block text-xs text-gray-500 uppercase">Email Address</strong>
                <span>${emailDisplay}</span>
              </p>
            </div>
          </section>

          ${
            event.description && event.description.trim() !== ""
              ? `
                <section class="py-6 border-b border-gray-100">
                  <h2 class="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                    <span class="w-1.5 h-5 bg-theme rounded-full"></span>
                    Description &amp; Notes
                  </h2>

                  <p class="text-gray-700 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                    ${event.description}
                  </p>
                </section>
              `
              : ""
          }

          <!-- Finance Details -->
          <section class="py-6">
            <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span class="w-1.5 h-5 bg-theme rounded-full"></span>
              Financial Summary
            </h2>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="bg-theme-soft border border-theme-light rounded-xl p-4 text-center shadow-sm">
                <p class="text-xs font-medium text-gray-600 uppercase">
                  Total Agreed Amount
                </p>
                <p class="text-xl font-bold text-gray-800 mt-1">
                  ${formatCurrency(event.finance.requestedAmount)}
                </p>
              </div>

              <div class="bg-green-50 border border-green-200 rounded-xl p-4 text-center shadow-sm">
                <p class="text-xs font-medium text-green-700 uppercase">
                  Advance / Paid
                </p>
                <p class="text-xl font-bold text-green-800 mt-1">
                  ${formatCurrency(event.finance.totalPaid)}
                </p>
              </div>

              <div class="bg-theme-soft border border-theme-light rounded-xl p-4 text-center shadow-sm">
                <p class="text-xs font-medium text-gray-600 uppercase">
                  Remaining Balance
                </p>
                <p class="text-xl font-bold text-theme mt-1">
                  ${formatCurrency(event.finance.confirmedAmount)}
                </p>
              </div>
            </div>
          </section>

          <!-- Footer Actions -->
          <div class="flex justify-between items-center flex-wrap gap-4 pt-6 mt-4 border-t border-gray-200">
            <p class="text-sm text-gray-700">
              <strong>Booked By:</strong> ${event.bookingBy}
            </p>

            <div class="flex items-center gap-2 no-print">
              ${
                currentStatus !== "Cancelled"
                  ? `
                  <a
                    href="edit-event.html?id=${event.id}"
                    class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors"
                  >
                    Edit Booking
                  </a>
                `
                  : ""
              }

              ${
                currentStatus === "Upcoming" || currentStatus === "In Progress"
                  ? `
                  <button
                    type="button"
                    onclick="openCancelModal(${event.id})"
                    class="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-sm cursor-pointer transition-colors"
                  >
                    Cancel Event
                  </button>
                `
                  : ""
              }

              <div class="h-6 border-l border-gray-300 mx-1"></div>

              <button
                type="button"
                onclick="window.print()"
                class="px-4 py-2 rounded-lg btn-theme font-medium text-sm cursor-pointer"
              >
                🖨️ Print Slip
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error(error);
    document.getElementById("eventContainer").innerHTML = `
      <p class="text-center text-red-500 font-medium">
        Failed to load event details.
      </p>
    `;
  }
}
