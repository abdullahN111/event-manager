function initEventModal() {
  const requested = document.getElementById("requestedAmount");
  const advance = document.getElementById("totalPaid");
  const remaining = document.getElementById("confirmedAmount");

  const eventModal = document.getElementById("eventModal");
  const eventForm = document.getElementById("eventForm");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const cancelModalBtn = document.getElementById("cancelModalBtn");

  const eventDate = document.getElementById("eventDate");
  const startTime = document.getElementById("startTime");
  const endTime = document.getElementById("endTime");

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
    console.error("Event modal elements not found.");
    return;
  }

  let availabilityTimeout = null;
  let isTimeAvailable = true;



  function openEventModal() {
    eventForm.reset();

    remaining.value = "";

    isTimeAvailable = true;

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



  function updateRemaining() {
    const total = Number(requested.value) || 0;
    const paid = Number(advance.value) || 0;

    remaining.value = total - paid;
  }

  requested.addEventListener("input", updateRemaining);
  advance.addEventListener("input", updateRemaining);



  async function checkAvailability() {
    const date = eventDate.value;
    const start = startTime.value;
    const end = endTime.value;


    if (!date || !start || !end) {
      isTimeAvailable = true;
      return;
    }


    if (start >= end) {
      isTimeAvailable = false;

      showMessage(
        "error",
        "End time must be after the start time."
      );

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
          `http://localhost/management_project/backend/check_event_availability.php?${params.toString()}`
        );

        const data = await response.json();

        if (data.status === "success") {
          if (data.available) {
            isTimeAvailable = true;
          } else {
            isTimeAvailable = false;

            showMessage(
              "error",
              `❌ ${data.message}`
            );
          }
        } else {
          isTimeAvailable = false;

          showMessage(
            "error",
            "Unable to check event availability."
          );
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
      showMessage(
        "error",
        "❌ End time must be after start time."
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
        `http://localhost/management_project/backend/check_event_availability.php?${params.toString()}`
      );

      const availabilityData = await availabilityResponse.json();

      if (
        availabilityData.status === "success" &&
        !availabilityData.available
      ) {
        isTimeAvailable = false;

        showMessage(
          "error",
          `❌ ${availabilityData.message}`
        );

        return;
      }

      isTimeAvailable = true;

    } catch (error) {
      console.error("Availability check failed:", error);

    }



    const formData = {
      eventName: document.getElementById("eventName").value,
      status: document.getElementById("status").value,
      eventDate: eventDate.value,
      bookingDate: document.getElementById("bookingDate").value,
      startTime: startTime.value,
      endTime: endTime.value,
      description: document.getElementById("description").value,

      customerName: document.getElementById("customerName").value,
      customerEmail: document.getElementById("customerEmail").value,
      customerPhone: document.getElementById("customerPhone").value,

      requestedAmount: document.getElementById("requestedAmount").value,
      totalPaid: document.getElementById("totalPaid").value,
      confirmedAmount: document.getElementById("confirmedAmount").value,

      bookingBy: document.getElementById("bookingBy").value,
    };

    try {
      const response = await fetch(
        "http://localhost/management_project/backend/add_event.php",
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
        showMessage(
          "success",
          "Event created successfully!"
        );

        setTimeout(() => {
          eventModal.classList.add("hidden");

          eventForm.reset();

          remaining.value = "";

          if (typeof loadEvents === "function") {
            loadEvents();
          }
        }, 1000);

      } else {
        showMessage(
          "error",
          "❌ " + data.message
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


document.addEventListener(
  "componentsLoaded",
  initEventModal
);