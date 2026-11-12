const cancelModal = document.getElementById("cancelModal");
const cancelBackBtn = document.getElementById("cancelBackBtn");
const confirmCancelBtn = document.getElementById("confirmCancelBtn");

let cancelEventId = null;
let events = [];

function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return "Rs. " + num.toLocaleString("en-PK");
}

function formatTime(time24) {
  if (!time24) return "";
  const [hour, minute] = time24.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  return `${h}:${minute.toString().padStart(2, "0")} ${period}`;
}

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

  const startTimeStr = event.time?.start || event.startTime || "00:00";
  const endTimeStr = event.time?.end || event.endTime || "23:59";

  const [sh, sm] = startTimeStr.split(":").map(Number);
  const [eh, em] = endTimeStr.split(":").map(Number);

  start.setHours(sh, sm, 0, 0);
  end.setHours(eh, em, 0, 0);

  if (now < start) return "Upcoming";
  if (now >= start && now <= end) return "In Progress";
  return "Completed";
}

function getPaymentStatus(event) {
  const requested = Number(event.finance?.requestedAmount ?? 0);
  const paid = Number(event.finance?.totalPaid ?? 0);

  if (paid <= 0) {
    return "Unpaid";
  }

  if (paid >= requested) {
    return "Paid";
  }

  return "Partial";
}

function getPaymentBadgeClass(paymentStatus) {
  switch (paymentStatus) {
    case "Paid":
      return "bg-green-100 text-green-800";
    case "Partial":
      return "bg-yellow-100 text-yellow-800";
    case "Unpaid":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function updateSummaryStats(allEvents) {
  const statUpcomingEl = document.getElementById("statUpcomingCount");
  const statMonthEl = document.getElementById("statMonthCount");
  const statPendingEl = document.getElementById("statPendingAmount");

  if (!statUpcomingEl && !statMonthEl && !statPendingEl) return;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let upcomingCount = 0;
  let thisMonthCount = 0;
  let pendingAmount = 0;

  allEvents.forEach((e) => {
    const status = getDynamicStatus(e);
    if (status === "Cancelled") return;

    if (status === "Upcoming" || status === "In Progress") {
      upcomingCount++;
    }

    const d = parseLocalDate(e.eventDate);
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      thisMonthCount++;
    }

    const total = Number(e.finance?.requestedAmount ?? 0);
    const paid = Number(e.finance?.totalPaid ?? 0);
    const remaining = Math.max(0, total - paid);
    pendingAmount += remaining;
  });

  if (statUpcomingEl) statUpcomingEl.textContent = upcomingCount;
  if (statMonthEl) statMonthEl.textContent = thisMonthCount;
  if (statPendingEl) statPendingEl.textContent = formatCurrency(pendingAmount);
}

function getFilteredEvents(sourceEvents) {
  const searchInput = document.getElementById("eventSearchInput");
  const paymentFilter = document.getElementById("paymentFilterSelect");

  const query = (searchInput?.value || "").trim().toLowerCase();
  const paymentType = paymentFilter?.value || "ALL";

  return sourceEvents.filter((e) => {
    const paymentStatus = getPaymentStatus(e);
    if (paymentType !== "ALL" && paymentStatus !== paymentType) {
      return false;
    }

    if (!query) return true;

    const nameMatch = (e.eventName || "").toLowerCase().includes(query);
    const customerMatch = (e.customer?.name || "").toLowerCase().includes(query);
    const phoneMatch = (e.customer?.phone || "").toLowerCase().includes(query);
    const dateMatch = (e.eventDate || "").toLowerCase().includes(query);

    return nameMatch || customerMatch || phoneMatch || dateMatch;
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const searchInput = document.getElementById("eventSearchInput");
  const paymentFilter = document.getElementById("paymentFilterSelect");

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderUpcomingEvents(events);
      renderAllEvents(events);
    });
  }

  if (paymentFilter) {
    paymentFilter.addEventListener("change", () => {
      renderUpcomingEvents(events);
      renderAllEvents(events);
    });
  }

  await loadEvents();
});

async function loadEvents() {
  try {
    const response = await fetch(
      "../backend/get_events.php"
    );

    const data = await response.json();

    if (data.status === "success") {
      events = data.data || [];

      updateSummaryStats(events);

      if (typeof renderCalendar === "function" && document.getElementById("calendarGrid")) {
        renderCalendar(events);
      }

      if (document.getElementById("upcomingEventsBody")) {
        renderUpcomingEvents(events);
      }

      if (document.getElementById("allEventsBody")) {
        renderAllEvents(events);
      }
    }
  } catch (error) {
    console.error("Failed to load events:", error);
  }
}

function renderUpcomingEvents(allEvents) {
  const tbody = document.getElementById("upcomingEventsBody");
  if (!tbody) return;

  const filtered = getFilteredEvents(allEvents);

  const processed = filtered
    .map((e) => ({
      ...e,
      currentStatus: getDynamicStatus(e),
      paymentStatus: getPaymentStatus(e),
    }))
    .filter(
      (e) =>
        e.currentStatus === "Upcoming" || e.currentStatus === "In Progress"
    )
    .sort(
      (a, b) =>
        new Date(`${a.eventDate}T${a.time.start}`) -
        new Date(`${b.eventDate}T${b.time.start}`)
    )
    .slice(0, 10);

  tbody.innerHTML = "";

  if (!processed.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-8 text-gray-500 text-sm">
          No upcoming events found.
        </td>
      </tr>
    `;
    return;
  }

  processed.forEach((event) => {
    let badge = "";

    switch (event.currentStatus) {
      case "Upcoming":
        badge = "bg-blue-100 text-blue-800";
        break;
      case "In Progress":
        badge = "bg-green-100 text-green-800";
        break;
      case "Cancelled":
        badge = "bg-red-100 text-red-800";
        break;
      default:
        badge = "bg-gray-100 text-gray-800";
    }

    const eventDay = parseLocalDate(event.eventDate).toLocaleDateString(
      "en-US",
      { weekday: "long" }
    );

    const remaining = Math.max(
      0,
      Number(event.finance?.requestedAmount ?? 0) -
        Number(event.finance?.totalPaid ?? 0)
    );

    tbody.innerHTML += `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
          ${event.eventName}
        </td>

        <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
          ${event.customer.name}
        </td>

        <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
          ${event.customer.phone}
        </td>

        <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
          ${event.eventDate} <span class="text-gray-400">(${eventDay.slice(0, 3)})</span>
        </td>

        <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
          ${formatTime(event.time.start)} - ${formatTime(event.time.end)}
        </td>

        <td class="px-4 py-4 whitespace-nowrap">
          <span class="px-2.5 py-1 rounded-full text-xs font-semibold ${badge}">
            ${event.currentStatus}
          </span>
        </td>

        <td class="px-4 py-4 whitespace-nowrap">
          <span class="px-2.5 py-1 rounded-full text-xs font-semibold ${getPaymentBadgeClass(event.paymentStatus)}">
            ${event.paymentStatus}
          </span>
          ${
            remaining > 0
              ? `<span class="block text-xs text-gray-500 mt-0.5">Bal: ${formatCurrency(remaining)}</span>`
              : ""
          }
        </td>

        <td class="px-4 py-4 whitespace-nowrap">
          <div class="flex items-center gap-2">
            <a
              href="edit-event.html?id=${event.id}"
              class="px-3 py-1 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
            >
              Edit
            </a>

            ${
              event.currentStatus === "Upcoming" ||
              event.currentStatus === "In Progress"
                ? `
              <button
                type="button"
                onclick="openCancelModal(${event.id})"
                class="px-3 py-1 text-xs font-medium bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors cursor-pointer"
              >
                Cancel
              </button>
            `
                : ""
            }

            <div class="h-5 border-l border-gray-300 mx-0.5"></div>

            <a
              href="event-details.html?id=${event.id}"
              class="px-3 py-1 text-xs font-medium btn-theme rounded-md"
            >
              Details
            </a>
          </div>
        </td>
      </tr>
    `;
  });
}

function renderAllEvents(allEvents) {
  const tbody = document.getElementById("allEventsBody");
  if (!tbody) return;

  const filtered = getFilteredEvents(allEvents);

  const processed = filtered
    .map((e) => ({
      ...e,
      currentStatus: getDynamicStatus(e),
      paymentStatus: getPaymentStatus(e),
    }))
    .sort(
      (a, b) =>
        new Date(`${a.eventDate}T${a.time.start}`) -
        new Date(`${b.eventDate}T${b.time.start}`)
    );

  tbody.innerHTML = "";

  if (!processed.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-8 text-gray-500 text-sm">
          No events found.
        </td>
      </tr>
    `;
    return;
  }

  processed.forEach((event) => {
    let badge = "";

    switch (event.currentStatus) {
      case "Upcoming":
        badge = "bg-blue-100 text-blue-800";
        break;
      case "In Progress":
        badge = "bg-green-100 text-green-800";
        break;
      case "Cancelled":
        badge = "bg-red-100 text-red-800";
        break;
      default:
        badge = "bg-gray-100 text-gray-800";
    }

    const eventDay = parseLocalDate(event.eventDate).toLocaleDateString(
      "en-US",
      { weekday: "long" }
    );

    const remaining = Math.max(
      0,
      Number(event.finance?.requestedAmount ?? 0) -
        Number(event.finance?.totalPaid ?? 0)
    );

    tbody.innerHTML += `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="px-4 py-4 text-sm font-semibold text-gray-900">
          ${event.eventName}
        </td>

        <td class="px-4 py-4 text-sm text-gray-700">
          ${event.customer.name}
        </td>

        <td class="px-4 py-4 text-sm text-gray-600">
          ${event.customer.phone}
        </td>

        <td class="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
          ${event.eventDate} <span class="text-gray-400">(${eventDay.slice(0, 3)})</span>
        </td>

        <td class="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
          ${formatTime(event.time.start)} - ${formatTime(event.time.end)}
        </td>

        <td class="px-4 py-4 whitespace-nowrap">
          <span class="px-2.5 py-1 rounded-full text-xs font-semibold ${badge}">
            ${event.currentStatus}
          </span>
        </td>

        <td class="px-4 py-4 whitespace-nowrap">
          <span class="px-2.5 py-1 rounded-full text-xs font-semibold ${getPaymentBadgeClass(event.paymentStatus)}">
            ${event.paymentStatus}
          </span>
          ${
            remaining > 0 && event.currentStatus !== "Cancelled"
              ? `<span class="block text-xs text-gray-500 mt-0.5">Bal: ${formatCurrency(remaining)}</span>`
              : ""
          }
        </td>

        <td class="px-4 py-4 whitespace-nowrap">
          <div class="flex items-center gap-2">
            <a
              href="edit-event.html?id=${event.id}"
              class="px-3 py-1 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
            >
              Edit
            </a>

            <div class="h-5 border-l border-gray-300 mx-0.5"></div>

            <a
              href="event-details.html?id=${event.id}"
              class="px-3 py-1 text-xs font-medium btn-theme rounded-md"
            >
              Details
            </a>
          </div>
        </td>
      </tr>
    `;
  });
}

setInterval(() => {
  if (document.getElementById("upcomingEventsBody")) {
    renderUpcomingEvents(events);
  }
  if (document.getElementById("allEventsBody")) {
    renderAllEvents(events);
  }
}, 60000);

function openCancelModal(id) {
  cancelEventId = id;
  if (cancelModal) {
    cancelModal.classList.remove("hidden");
  }
}

function closeCancelModal() {
  cancelEventId = null;
  if (cancelModal) {
    cancelModal.classList.add("hidden");
  }
}

if (cancelBackBtn) {
  cancelBackBtn.addEventListener("click", closeCancelModal);
}

if (cancelModal) {
  cancelModal.addEventListener("click", (e) => {
    if (e.target === cancelModal) {
      closeCancelModal();
    }
  });
}

if (confirmCancelBtn) {
  confirmCancelBtn.addEventListener("click", async () => {
    if (!cancelEventId) return;

    try {
      const response = await fetch(
        "../backend/cancel_event.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: cancelEventId,
          }),
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        events = events.map((event) =>
          event.id == cancelEventId ? { ...event, status: "Cancelled" } : event
        );
        showMessage("success", "Event cancelled!");
        updateSummaryStats(events);
        renderUpcomingEvents(events);
        renderAllEvents(events);

        if (typeof renderCalendar === "function" && document.getElementById("calendarGrid")) {
          renderCalendar(events);
        }

        if (typeof loadEventDetails === "function" && document.getElementById("eventContainer")) {
          loadEventDetails();
        }

        closeCancelModal();
      } else {
        showMessage("error", "❌ " + data.message);
      }
    } catch (err) {
      console.error(err);
      showMessage("error", "Something went wrong.");
    }
  });
}

function printTable(tableId, title) {
  const table = document.getElementById(tableId);
  if (!table) return;

  const clonedTable = table.cloneNode(true);

  clonedTable.querySelectorAll("tr").forEach((row) => {
    if (row.lastElementChild && row.children.length > 1) {
      row.removeChild(row.lastElementChild);
    }
  });

  const primaryColor =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--primary")
      .trim() || "#e91e63";

  const printWindow = window.open("", "_blank");

  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            font-family: Arial, Helvetica, sans-serif;
            margin: 0;
            padding: 25px;
            color: #1f2937;
            background: #ffffff;
            font-size: 12px;
          }

          .print-container {
            max-width: 1200px;
            margin: 0 auto;
          }

          .print-header {
            text-align: center;
            margin-bottom: 22px;
            padding-bottom: 18px;
            border-bottom: 3px solid ${primaryColor};
          }

          .print-logo {
            width: 58px;
            height: 58px;
            border-radius: 50%;
            object-fit: contain;
            margin-bottom: 8px;
          }

          .print-title {
            font-size: 22px;
            font-weight: 700;
            color: #111827;
            margin: 0;
            letter-spacing: -0.3px;
          }

          .print-subtitle {
            font-size: 14px;
            color: ${primaryColor};
            font-weight: 600;
            margin: 6px 0 0;
          }

          table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            table-layout: auto;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            overflow: hidden;
          }

          th,
          td {
            padding: 9px 10px;
            text-align: left;
            vertical-align: middle;
            border-right: 1px solid #e5e7eb;
            border-bottom: 1px solid #e5e7eb;
          }

          th:last-child,
          td:last-child {
            border-right: none;
          }

          tr:last-child td {
            border-bottom: none;
          }

          th {
            background: #f3f4f6;
            color: #111827;
            font-size: 12px;
            font-weight: 700;
            white-space: nowrap;
          }

          td {
            color: #374151;
            background: #ffffff;
          }

          tbody tr:nth-child(even) td {
            background: #f9fafb;
          }

          th:nth-child(3),
          td:nth-child(3),
          th:nth-child(4),
          td:nth-child(4),
          th:nth-child(5),
          td:nth-child(5) {
            white-space: nowrap;
          }

          tr {
            page-break-inside: avoid;
          }

          thead {
            display: table-header-group;
          }

          @page {
            size: auto;
            margin: 14mm;
          }

          @media print {
            body {
              padding: 0;
              font-size: 12px;
            }

            .print-container {
              max-width: none;
            }

            .print-header {
              margin-bottom: 22px;
            }

            table {
              border-radius: 4px;
            }

            th {
              background: #f3f4f6 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            tbody tr:nth-child(even) td {
              background: #f9fafb !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>

      <body>
        <div class="print-container">
          <div class="print-header">
            <img
              src="assets/logo.png"
              class="print-logo"
              alt="Events Manager Logo"
            />

            <h1 class="print-title">
              Events Manager
            </h1>

            <p class="print-subtitle">
              ${title}
            </p>
          </div>

          ${clonedTable.outerHTML}
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };
}
