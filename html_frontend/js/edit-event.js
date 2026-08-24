const GET_EVENTS_URL =
  "http://localhost/management_project/backend/get_events.php";

const UPDATE_EVENT_URL =
  "http://localhost/management_project/backend/update_event.php";

let eventId = null;

document.addEventListener("componentsLoaded", initEditEvent);

async function initEditEvent() {
  const params = new URLSearchParams(window.location.search);

  eventId = params.get("id");

  if (!eventId) {
    showMessage("error", "Event ID is missing.");
    return;
  }

  const form = document.getElementById("editEventForm");
  const loading = document.getElementById("loadingMessage");

  const requestedAmount = document.getElementById("requestedAmount");
  const totalPaid = document.getElementById("totalPaid");
  const confirmedAmount = document.getElementById("confirmedAmount");

  function updateRemaining() {
    const total = Number(requestedAmount.value) || 0;
    const paid = Number(totalPaid.value) || 0;

    confirmedAmount.value = Math.max(0, total - paid);
  }

  requestedAmount.addEventListener("input", updateRemaining);
  totalPaid.addEventListener("input", updateRemaining);

  try {
    const response = await fetch(GET_EVENTS_URL);

    if (!response.ok) {
      throw new Error("Unable to load events.");
    }

    const data = await response.json();

    const events = Array.isArray(data)
      ? data
      : data.events || data.data || [];

    const event = events.find(
      (item) => String(item.id) === String(eventId)
    );

    if (!event) {
      loading.innerHTML = "Event not found.";
      return;
    }


    const currentStatus =
      typeof getDynamicStatus === "function"
        ? getDynamicStatus(event)
        : event.status;

    if (currentStatus !== "Upcoming" && currentStatus !== "Completed") {
      loading.innerHTML = `
        <div class="text-red-600 font-medium mb-2">
          This event cannot be edited.
        </div>

        <div class="text-gray-500 text-sm">
          Only upcoming and Completed events can be edited.
        </div>

        <a
          href="events.html"
          class="inline-block mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          Back to Events
        </a>
      `;

      return;
    }


    document.getElementById("eventName").value =
      event.eventName || "";

    document.getElementById("status").value =
      event.status || "Upcoming";

    document.getElementById("eventDate").value =
      event.eventDate || "";

    document.getElementById("bookingDate").value =
      event.bookingDate || "";

    document.getElementById("startTime").value =
      event.time?.start || event.startTime || "";

    document.getElementById("endTime").value =
      event.time?.end || event.endTime || "";

    document.getElementById("description").value =
      event.description || "";


    document.getElementById("customerName").value =
      event.customer?.name || event.customerName || "";

    document.getElementById("customerEmail").value =
      event.customer?.email || event.customerEmail || "";

    document.getElementById("customerPhone").value =
      event.customer?.phone || event.customerPhone || "";

    document.getElementById("requestedAmount").value =
      event.finance?.requestedAmount ??
      event.requestedAmount ??
      0;

    document.getElementById("totalPaid").value =
      event.finance?.totalPaid ??
      event.totalPaid ??
      0;

    document.getElementById("confirmedAmount").value =
      event.finance?.confirmedAmount ??
      event.confirmedAmount ??
      0;

    document.getElementById("bookingBy").value =
      event.bookingBy || "";


    updateRemaining();

    loading.classList.add("hidden");
    form.classList.remove("hidden");

  } catch (error) {
    console.error(error);

    loading.innerHTML = `
      <div class="text-red-600 font-medium">
        Unable to load event.
      </div>
    `;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const requested = Number(
      document.getElementById("requestedAmount").value
    );

    const paid = Number(
      document.getElementById("totalPaid").value
    );

    if (paid > requested) {
      showMessage(
        "error",
        "Total paid cannot be greater than the total amount."
      );

      return;
    }

    const formData = {
      id: eventId,

      eventName: document.getElementById("eventName").value,
      status: document.getElementById("status").value,

      eventDate: document.getElementById("eventDate").value,
      bookingDate: document.getElementById("bookingDate").value,

      startTime: document.getElementById("startTime").value,
      endTime: document.getElementById("endTime").value,

      description: document.getElementById("description").value,

      customerName: document.getElementById("customerName").value,
      customerEmail: document.getElementById("customerEmail").value,
      customerPhone: document.getElementById("customerPhone").value,

      requestedAmount: requested,
      totalPaid: paid,
      confirmedAmount: requested - paid,

      bookingBy: document.getElementById("bookingBy").value,
    };


    try {
      const response = await fetch(UPDATE_EVENT_URL, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.status === "success") {

        showMessage(
          "success",
          "Event updated successfully!"
        );

        setTimeout(() => {
          window.location.href =
            `event-details.html?id=${eventId}`;
        }, 1000);

      } else {

        showMessage(
          "error",
          data.message || "Unable to update event."
        );

      }

    } catch (error) {

      console.error(error);

      showMessage(
        "error",
        "⚠️ Unable to connect to the server."
      );

    }
  });
}