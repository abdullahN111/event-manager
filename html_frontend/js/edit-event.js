const GET_EVENT_URL = "../backend/get_event.php";

const UPDATE_EVENT_URL = "../backend/update_event.php";

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

  const requestedAmount = document.getElementById("edit_requestedAmount");
  const totalPaid = document.getElementById("edit_totalPaid");
  const confirmedAmount = document.getElementById("edit_confirmedAmount");

  function updateRemaining() {
    const total = Number(requestedAmount.value) || 0;
    const paid = Number(totalPaid.value) || 0;
    confirmedAmount.value = Math.max(0, total - paid);
  }

  requestedAmount.addEventListener("input", updateRemaining);
  totalPaid.addEventListener("input", updateRemaining);

  try {
    const response = await fetch(`${GET_EVENT_URL}?id=${eventId}`);

    if (!response.ok) {
      throw new Error("Unable to load event.");
    }

    const data = await response.json();

    if (data.status !== "success" || !data.data) {
      loading.innerHTML = "Event not found.";
      return;
    }

    const event = data.data;

    if (event.status === "Cancelled") {
      loading.innerHTML = `
        <div class="text-red-600 font-medium mb-2">
          This event has been cancelled and cannot be edited.
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

    document.getElementById("edit_eventName").value = event.eventName || "";
    document.getElementById("edit_status").value = event.status || "Upcoming";
    document.getElementById("edit_eventDate").value = event.eventDate || "";
    document.getElementById("edit_bookingDate").value = event.bookingDate || "";
    document.getElementById("edit_startTime").value =
      event.time?.start || event.startTime || "";
    document.getElementById("edit_endTime").value =
      event.time?.end || event.endTime || "";
    document.getElementById("edit_description").value =
      event.description || "";

    document.getElementById("edit_customerName").value =
      event.customer?.name || event.customerName || "";
    document.getElementById("edit_customerEmail").value =
      event.customer?.email || event.customerEmail || "";
    document.getElementById("edit_customerPhone").value =
      event.customer?.phone || event.customerPhone || "";

    requestedAmount.value =
      event.finance?.requestedAmount ?? event.requestedAmount ?? 0;
    totalPaid.value = event.finance?.totalPaid ?? event.totalPaid ?? 0;
    confirmedAmount.value =
      event.finance?.confirmedAmount ?? event.confirmedAmount ?? 0;

    document.getElementById("edit_bookingBy").value = event.bookingBy || "";

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

    const requested = Number(requestedAmount.value) || 0;
    const paid = Number(totalPaid.value) || 0;

    if (paid > requested) {
      showMessage(
        "error",
        "Total paid cannot be greater than the total amount."
      );
      return;
    }

    const startVal = document.getElementById("edit_startTime").value;
    const endVal = document.getElementById("edit_endTime").value;

    if (startVal >= endVal) {
      showMessage("error", "End time must be after start time.");
      return;
    }

    const formData = {
      id: eventId,
      eventName: document.getElementById("edit_eventName").value.trim(),
      status: document.getElementById("edit_status").value,
      eventDate: document.getElementById("edit_eventDate").value,
      bookingDate: document.getElementById("edit_bookingDate").value,
      startTime: startVal,
      endTime: endVal,
      description: document.getElementById("edit_description").value.trim(),
      customerName: document.getElementById("edit_customerName").value.trim(),
      customerEmail: document.getElementById("edit_customerEmail").value.trim(),
      customerPhone: document.getElementById("edit_customerPhone").value.trim(),
      requestedAmount: requested,
      totalPaid: paid,
      confirmedAmount: Math.max(0, requested - paid),
      bookingBy: document.getElementById("edit_bookingBy").value.trim(),
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
        showMessage("success", "Event updated successfully!");

        setTimeout(() => {
          window.location.href = `event-details.html?id=${eventId}`;
        }, 900);
      } else {
        showMessage("error", data.message || "Unable to update event.");
      }
    } catch (error) {
      console.error(error);
      showMessage("error", "⚠️ Unable to connect to the server.");
    }
  });
}
