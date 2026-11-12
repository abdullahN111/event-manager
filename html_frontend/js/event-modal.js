function getTodayDateString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function initEventModal() {
  const requested = document.getElementById("requestedAmount");
  const advance = document.getElementById("totalPaid");
  const remaining = document.getElementById("confirmedAmount");

  const eventModal = document.getElementById("eventModal");
  const eventForm = document.getElementById("eventForm");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const cancelModalBtn = document.getElementById("cancelModalBtn");

  const eventDate = document.getElementById("eventDate");
  const bookingDate = document.getElementById("bookingDate");
  const startTime = document.getElementById("startTime");
  const endTime = document.getElementById("endTime");
  const feedbackEl = document.getElementById("availabilityFeedback");

  if (
    !requested ||
    !advance ||
    !remaining ||
    !eventModal ||
    !eventForm ||
    !closeModalBtn ||
    !cancelModalBtn ||
    !eventDate ||
    !startTime ||
    !endTime
  ) {
    return;
  }

  let availabilityTimeout = null;
  let isTimeAvailable = true;

  function setFeedback(type, text) {
    if (!feedbackEl) return;
    if (!text) {
      feedbackEl.classList.add("hidden");
      feedbackEl.textContent = "";
      return;
    }

    feedbackEl.classList.remove(
      "hidden",
      "bg-green-50",
      "text-green-700",
      "border-green-200",
      "bg-red-50",
      "text-red-700",
      "border-red-200"
    );

    if (type === "success") {
      feedbackEl.classList.add(
        "bg-green-50",
        "text-green-700",
        "border",
        "border-green-200"
      );
    } else {
      feedbackEl.classList.add(
        "bg-red-50",
        "text-red-700",
        "border",
        "border-red-200"
      );
    }

    feedbackEl.textContent = text;
  }

  function openEventModal() {
    eventForm.reset();
    remaining.value = "";
    isTimeAvailable = true;
    setFeedback(null, "");

    const todayStr = getTodayDateString();
    if (bookingDate) {
      bookingDate.value = todayStr;
    }

    if (typeof selectedDate !== "undefined" && selectedDate instanceof Date) {
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const d = String(selectedDate.getDate()).padStart(2, "0");
      eventDate.value = `${y}-${m}-${d}`;
    } else {
      eventDate.value = todayStr;
    }

    eventModal.classList.remove("hidden");
  }

  document.querySelectorAll(".newEventBtn").forEach((btn) => {
    btn.addEventListener("click", openEventModal);
  });

  closeModalBtn.addEventListener("click", () => {
    eventModal.classList.add("hidden");
  });

  cancelModalBtn.addEventListener("click", () => {
    eventModal.classList.add("hidden");
  });

  eventModal.addEventListener("click", (e) => {
    if (e.target === eventModal) {
      eventModal.classList.add("hidden");
    }
  });

  function updateRemaining() {
    const total = Number(requested.value) || 0;
    const paid = Number(advance.value) || 0;
    remaining.value = Math.max(0, total - paid);
  }

  requested.addEventListener("input", updateRemaining);
  advance.addEventListener("input", updateRemaining);

  async function checkAvailability() {
    const date = eventDate.value;
    const start = startTime.value;
    const end = endTime.value;

    if (!date || !start || !end) {
      isTimeAvailable = true;
      setFeedback(null, "");
      return;
    }

    if (start >= end) {
      isTimeAvailable = false;
      setFeedback("error", "⚠️ End time must be after the start time.");
      return;
    }

    clearTimeout(availabilityTimeout);

    availabilityTimeout = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          eventDate: date,
          startTime: start,
          endTime: end,
        });

        const response = await fetch(
          `../backend/check_event_availability.php?${params.toString()}`
        );

        const data = await response.json();

        if (data.status === "success") {
          if (data.available) {
            isTimeAvailable = true;
            setFeedback("success", "✓ This date and time slot is available.");
          } else {
            isTimeAvailable = false;
            setFeedback("error", `❌ ${data.message}`);
            showMessage("error", `❌ ${data.message}`);
          }
        } else {
          isTimeAvailable = false;
          setFeedback("error", "Unable to check event availability.");
        }
      } catch (error) {
        console.error(error);
        isTimeAvailable = true;
      }
    }, 300);
  }

  eventDate.addEventListener("change", checkAvailability);
  startTime.addEventListener("change", checkAvailability);
  endTime.addEventListener("change", checkAvailability);

  eventForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (startTime.value >= endTime.value) {
      showMessage("error", "❌ End time must be after start time.");
      return;
    }

    const totalAmt = Number(requested.value) || 0;
    const paidAmt = Number(advance.value) || 0;

    if (paidAmt > totalAmt) {
      showMessage(
        "error",
        "❌ Advance/Paid amount cannot exceed Total Amount."
      );
      return;
    }

    try {
      const params = new URLSearchParams({
        eventDate: eventDate.value,
        startTime: startTime.value,
        endTime: endTime.value,
      });

      const availabilityResponse = await fetch(
        `../backend/check_event_availability.php?${params.toString()}`
      );

      const availabilityData = await availabilityResponse.json();

      if (
        availabilityData.status === "success" &&
        !availabilityData.available
      ) {
        isTimeAvailable = false;
        setFeedback("error", `❌ ${availabilityData.message}`);
        showMessage("error", `❌ ${availabilityData.message}`);
        return;
      }

      isTimeAvailable = true;
    } catch (error) {
      console.error("Availability check failed:", error);
    }

    const formData = {
      eventName: document.getElementById("eventName").value.trim(),
      status: document.getElementById("status").value,
      eventDate: eventDate.value,
      bookingDate: document.getElementById("bookingDate").value,
      startTime: startTime.value,
      endTime: endTime.value,
      description: document.getElementById("description").value.trim(),

      customerName: document.getElementById("customerName").value.trim(),
      customerEmail: document.getElementById("customerEmail").value.trim(),
      customerPhone: document.getElementById("customerPhone").value.trim(),

      requestedAmount: totalAmt,
      totalPaid: paidAmt,
      confirmedAmount: Math.max(0, totalAmt - paidAmt),

      bookingBy: document.getElementById("bookingBy").value.trim(),
    };

    try {
      const response = await fetch(
        "../backend/add_event.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        showMessage("success", "Event booking created successfully!");

        setTimeout(() => {
          eventModal.classList.add("hidden");
          eventForm.reset();
          remaining.value = "";
          setFeedback(null, "");

          if (typeof loadEvents === "function") {
            loadEvents();
          } else {
            window.location.href = "events.html";
          }
        }, 800);
      } else {
        showMessage("error", "❌ " + data.message);
      }
    } catch (error) {
      console.error(error);
      showMessage("error", "⚠️ Unable to connect to the server.");
    }
  });
}

document.addEventListener("componentsLoaded", initEventModal);
