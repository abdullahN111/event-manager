let user = null;

async function checkSession() {
  try {
    const response = await fetch(
      "http://localhost/management_project/backend/check_session.php",
      {
        credentials: "include",
      },
    );

    const data = await response.json();

    if (data.status !== "success") {
      window.location.href = "login.html";
      return false;
    }

    user = data.user;
    return true;
  } catch (error) {
    console.error(error);
    window.location.href = "login.html";
    return false;
  }
}

const cancelModal = document.getElementById("cancelModal");
const cancelBackBtn = document.getElementById("cancelBackBtn");
const confirmCancelBtn = document.getElementById("confirmCancelBtn");

let cancelEventId = null;

async function initAuth() {
  const authenticated = await checkSession();

  if (!authenticated) return;

  const page = window.location.pathname.split("/").pop();

  const dashboardLink = document.getElementById("dashboardLink");
  const eventsLink = document.getElementById("eventsLink");

  const activeClasses = [
    "text-[#e91e63]",
    "font-medium",
    "border-b-2",
    "border-[#e91e63]",
    "pb-1",
  ];

  if (page === "index.html" && dashboardLink) {
    dashboardLink.classList.add(...activeClasses);
  }

  if (page === "events.html" && eventsLink) {
    eventsLink.classList.add(...activeClasses);
  }

  document.getElementById("userName").textContent =
    user?.name || "Admin";

  document.getElementById("userEmail").textContent =
    user?.email || "";

  document.getElementById("currentYear").textContent =
    new Date().getFullYear();

  document.getElementById("profileLetter").textContent =
    user?.name?.charAt(0).toUpperCase() || "A";

  const profileBtn = document.getElementById("profileBtn");
  const profileMenu = document.getElementById("profileMenu");
  const logoutBtn = document.getElementById("logoutBtn");

  profileBtn.addEventListener("click", () => {
    profileMenu.classList.toggle("hidden");
  });

  logoutBtn.addEventListener("click", async () => {
    try {
      const response = await fetch(
        "http://localhost/management_project/backend/logout.php",
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        window.location.href = "login.html";
      } else {
        alert("Logout failed.");
      }
    } catch (error) {
      console.error(error);
      alert("Unable to logout.");
    }
  });

  document.addEventListener("click", (e) => {
    if (
      !profileBtn.contains(e.target) &&
      !profileMenu.contains(e.target)
    ) {
      profileMenu.classList.add("hidden");
    }
  });
}

document.addEventListener("componentsLoaded", initAuth);

document.addEventListener("click", (e) => {
  const menu = document.getElementById("profileMenu");
  const btn = document.getElementById("profileBtn");

  if (!btn.contains(e.target) && !menu.contains(e.target)) {
    menu.classList.add("hidden");
  }
});

let events = [];

document.addEventListener("DOMContentLoaded", async () => {
  //   loadHeader();

  await loadEvents();

  document.getElementById("currentYear").textContent = new Date().getFullYear();
});

async function loadEvents() {
  //   console.log("Loading events...");

  const response = await fetch(
    "http://localhost/management_project/backend/get_events.php",
  );

  const data = await response.json();

  //   console.log(data);

  if (data.status === "success") {
    events = data.data;

    // console.log(events);

    if (typeof renderCalendar === "function") {
      renderCalendar(events);
    }

    if (document.getElementById("upcomingEventsBody")) {
      renderUpcomingEvents(events);
    }

    if (document.getElementById("allEventsBody")) {
      renderAllEvents(events);
    }
  }
}

function formatTime(time24) {
  const [hour, minute] = time24.split(":").map(Number);

  const period = hour >= 12 ? "PM" : "AM";

  const h = hour % 12 || 12;

  return `${h}:${minute.toString().padStart(2, "0")} ${period}`;
}

function getDynamicStatus(event) {
  if (event.status === "Cancelled") return "Cancelled";

  const now = new Date();

  const eventDate = new Date(event.eventDate);

  const start = new Date(eventDate);

  const end = new Date(eventDate);

  const [sh, sm] = event.time.start.split(":").map(Number);
  const [eh, em] = event.time.end.split(":").map(Number);

  start.setHours(sh, sm, 0);

  end.setHours(eh, em, 0);

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

function renderUpcomingEvents(events) {
  const tbody = document.getElementById("upcomingEventsBody");

  if (!tbody) return;

  const processed = events
    .map((e) => ({
      ...e,
      currentStatus: getDynamicStatus(e),
      paymentStatus: getPaymentStatus(e),
    }))
    .filter(
      (e) =>
        e.currentStatus === "Upcoming" || e.currentStatus === "In Progress",
    )
    .sort(
      (a, b) =>
        new Date(`${a.eventDate}T${a.time.start}`) -
        new Date(`${b.eventDate}T${b.time.start}`),
    )
    .slice(0, 10);

  tbody.innerHTML = "";

  if (!processed.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-6 text-gray-500">
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

    const eventDay = new Date(event.eventDate).toLocaleDateString("en-US", {
      weekday: "long",
    });

    tbody.innerHTML += `
<tr class="relative">

  <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
    ${event.eventName}
  </td>

  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
    ${event.customer.name}
  </td>

  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
    ${event.customer.phone}
  </td>

  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
    ${event.eventDate} - ${eventDay}
  </td>

  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
    ${formatTime(event.time.start)} -
    ${formatTime(event.time.end)}
  </td>

  <td class="px-4 py-4 whitespace-nowrap">
    <span class="px-2 py-1 rounded-full text-xs font-semibold ${badge}">
      ${event.currentStatus}
    </span>
  </td>
    <td class="px-4 py-4 whitespace-nowrap">
    <span class="px-2 py-1 rounded-full text-xs font-semibold ${getPaymentBadgeClass(event.paymentStatus)}">
      ${event.paymentStatus}
    </span>
  </td>

  <td class="px-4 py-4 whitespace-nowrap">
  <div class="flex items-center gap-2">

    <div class="flex items-center gap-2">
     
        <a
          href="edit-event.html?id=${event.id}"
          class="px-3 py-1 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded"
        >
          Edit
        </a>
     
      

      ${event.currentStatus === "Upcoming" || event.currentStatus === "In Progress"
        ? `
        <button
          onclick="openCancelModal(${event.id})"
          class="px-3 py-1 text-sm bg-red-600 text-white hover:bg-red-700 rounded"
        >
          Cancel
        </button>
      `
        : ""
      }
    </div>

    <div class="h-6 border-l border-gray-300 mx-1"></div>

    <a
      href="event-details.html?id=${event.id}"
      class="px-3 py-1 text-sm bg-pink-500 text-white hover:bg-pink-600 rounded"
    >
      Details
    </a>

  </div>
</td>

</tr>
`;
  });
}

function renderAllEvents(events) {
  const tbody = document.getElementById("allEventsBody");
  if (!tbody) return;

  const processed = events
    .map((e) => ({
      ...e,
      currentStatus: getDynamicStatus(e),
      paymentStatus: getPaymentStatus(e),
    }))
    .sort(
      (a, b) =>
        new Date(`${a.eventDate}T${a.time.start}`) -
        new Date(`${b.eventDate}T${b.time.start}`),
    );

  tbody.innerHTML = "";

  if (!processed.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-6 text-gray-500">
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

    const eventDay = new Date(event.eventDate).toLocaleDateString("en-US", {
      weekday: "long",
    });

    tbody.innerHTML += `
      <tr>

        <td class="px-4 py-4 text-sm font-medium">
          ${event.eventName}
        </td>

        <td class="px-4 py-4 text-sm">
          ${event.customer.name}
        </td>

        <td class="px-4 py-4 text-sm">
          ${event.customer.phone}
        </td>

        <td class="px-4 py-4 text-sm">
          ${event.eventDate} - ${eventDay.slice(0, 3)}
        </td>

        <td class="px-4 py-4 text-sm">
          ${formatTime(event.time.start)} -
          ${formatTime(event.time.end)}
        </td>

        <td class="px-4 py-4">
          <span class="px-2 py-1 rounded-full text-xs font-semibold ${badge}">
            ${event.currentStatus}
          </span>
        </td>
                <td class="px-4 py-4">
          <span class="px-2 py-1 rounded-full text-xs font-semibold ${getPaymentBadgeClass(event.paymentStatus)}">
            ${event.paymentStatus}
          </span>
        </td>

       <td class="px-4 py-4 whitespace-nowrap">
  <div class="flex items-center gap-2">

    <div class="flex items-center gap-2">
     
        <a
          href="edit-event.html?id=${event.id}"
          class="px-3 py-1 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded"
        >
          Edit
        </a>
     
    
    </div>

    <div class="h-6 border-l border-gray-300 mx-1"></div>

    <a
      href="event-details.html?id=${event.id}"
      class="px-3 py-1 text-sm bg-pink-500 text-white hover:bg-pink-600 rounded"
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
  renderUpcomingEvents(events);
  renderAllEvents(events);
}, 60000);

function openCancelModal(id) {
  cancelEventId = id;
  cancelModal.classList.remove("hidden");
}

function closeCancelModal() {
  cancelEventId = null;
  cancelModal.classList.add("hidden");
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
        "http://localhost/management_project/backend/cancel_event.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: cancelEventId,
          }),
        },
      );

      const data = await response.json();

      if (data.status === "success") {
        events = events.map((event) =>
          event.id == cancelEventId ? { ...event, status: "Cancelled" } : event,
        );
        showMessage("success", "Event cancelled!");
        renderUpcomingEvents(events);
        renderAllEvents(events);

        if (typeof renderCalendar === "function") {
          renderCalendar(events);
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
    if (row.lastElementChild) {
      row.removeChild(row.lastElementChild);
    }
  });

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
            border-bottom: 2px solid #e5e7eb;
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
            color: #6b7280;
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