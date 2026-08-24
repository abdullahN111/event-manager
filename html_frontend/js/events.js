function getDynamicStatus(event) {
  if (event.status === "Cancelled") {
    return "Cancelled";
  }

  const now = new Date();

  const eventDate = new Date(event.eventDate);

  const start = new Date(eventDate);
  const end = new Date(eventDate);

  const [sh, sm] = event.startTime.split(":").map(Number);
  const [eh, em] = event.endTime.split(":").map(Number);

  start.setHours(sh, sm, 0, 0);
  end.setHours(eh, em, 0, 0);

  if (now < start) {
    return "Upcoming";
  }

  if (now >= start && now <= end) {
    return "In Progress";
  }

  return "Completed";
}

document.addEventListener("DOMContentLoaded", loadEventDetails);
function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(time24) {
  const [hour, minute] = time24.split(":").map(Number);

  const period = hour >= 12 ? "PM" : "AM";

  const h = hour % 12 || 12;

  return `${h}:${minute.toString().padStart(2, "0")} ${period}`;
}

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
      `http://localhost/management_project/backend/get_event.php?id=${id}`,
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
    document.title = `${event.eventName}_${event.eventDate}`;

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

    container.innerHTML = `
      <div class="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 border border-gray-100">

        <div class="flex items-center justify-between mb-6">
          <h1 class="text-3xl font-bold text-gray-800">
            ${event.eventName}
          </h1>

          <span class="px-4 py-1 text-sm rounded-full font-semibold capitalize ${statusColor}">
            ${currentStatus}
          </span>
        </div>

        <div class="flex flex-col sm:flex-row sm:justify-between mb-6">
          <p class="text-gray-700">
            <strong>Date:</strong>
            ${formatDate(event.eventDate)}
          </p>

          <p class="text-gray-700">
            <strong>Time:</strong>
${formatTime(event.startTime)} - ${formatTime(event.endTime)}          
</p>
        </div>

        <hr class="my-6">

        <section class="mb-8">
          <h2 class="text-xl font-semibold text-gray-800 mb-4">
            Customer Info
          </h2>

          <div class="grid md:grid-cols-3 gap-4 text-gray-700">
            <p>
              <strong>Name:</strong>
              ${event.customer.name}
            </p>

            <p>
              <strong>Email:</strong>
              ${event.customer.email}
            </p>

            <p>
              <strong>Phone:</strong>
              ${event.customer.phone}
            </p>
          </div>
        </section>

        ${event.description && event.description.trim() !== ""
        ? `
          
            <hr class="my-6">

            <section class="mb-8">
              <h2 class="text-xl font-semibold text-gray-800 mb-3">
                Description
              </h2>

              <p class="text-gray-700 leading-relaxed">
                ${event.description}
              </p>
            </section>
          
        `
        : ""
      }

        <hr class="my-6">

        <section>
          <h2 class="text-xl font-semibold text-gray-800 mb-4">
            Finance Details
          </h2>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">

            <div class="bg-pink-50 rounded-lg p-4 text-center shadow-sm">
              <p class="text-sm text-gray-600">
                Requested
              </p>

              <p class="text-lg font-bold text-gray-800">
                ${event.finance.requestedAmount}
              </p>
            </div>

            <div class="bg-pink-50 rounded-lg p-4 text-center shadow-sm">
              <p class="text-sm text-gray-600">
                Total Paid
              </p>

              <p class="text-lg font-bold text-gray-800">
                ${event.finance.totalPaid}
              </p>
            </div>

            <div class="bg-pink-50 rounded-lg p-4 text-center shadow-sm">
              <p class="text-sm text-gray-600">
                Remaining
              </p>

              <p class="text-lg font-bold text-gray-800">
                ${event.finance.confirmedAmount}
              </p>
            </div>

          </div>
        </section>
      
    
        <div class="flex justify-between items-center flex-wrap gap-4 mt-16">
      <p class="text-gray-700">
        <strong>Booking by:</strong>
        ${event.bookingBy}
      </p>

      <div class="flex items-center gap-2">

        <div class="flex items-center gap-2">
        
          
            <a href="edit-event.html?id=${event.id}"
            class="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm"
          >
            Edit
          </a>
      

          ${currentStatus === "Upcoming" || currentStatus === "In Progress"
        ? `
          <button
            onclick="openCancelModal(${event.id})"
            class="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-sm"
          >
            Cancel
          </button>
        `
        : ""
      }
        </div>

        <div class="h-6 border-l border-gray-300 mx-1"></div>

        <button
          onclick="window.print()"
          class="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm"
        >
          Print Event
        </button>

      </div>
    </div>
  </div>
</div>
`;
  } catch (error) {
    document.getElementById("eventContainer").innerHTML = `
      <p class="text-center text-red-500 font-medium">
        Failed to load event details.
      </p>
    `;
  }
}
