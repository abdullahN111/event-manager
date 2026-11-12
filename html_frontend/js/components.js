// Automatically switch from file:// to http://localhost/ if opened directly from file explorer or Desktop shortcut
(function ensureLocalhost() {
  if (window.location.protocol === "file:") {
    const path = window.location.pathname.replace(/\\/g, "/");
    const htdocsIndex = path.toLowerCase().indexOf("/htdocs/");

    if (htdocsIndex !== -1) {
      const relativeFromHtdocs = path.substring(htdocsIndex + "/htdocs/".length);
      window.location.replace("http://localhost/" + relativeFromHtdocs);
    } else {
      window.location.replace(
        "http://localhost/event_manager/html_frontend/index.html"
      );
    }
  }
})();

async function loadComponent(id, file) {
  const element = document.getElementById(id);

  if (!element) {
    return false;
  }

  try {
    const response = await fetch(file);

    if (!response.ok) {
      throw new Error(`Failed to load ${file}`);
    }

    element.innerHTML = await response.text();
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

function initHeaderAndFooter() {
  const page = window.location.pathname.split("/").pop() || "index.html";

  const dashboardLink = document.getElementById("dashboardLink");
  const eventsLink = document.getElementById("eventsLink");

  if ((page === "index.html" || page === "") && dashboardLink) {
    dashboardLink.classList.add("nav-link-active");
  }

  if (
    (page === "events.html" ||
      page === "event-details.html" ||
      page === "edit-event.html") &&
    eventsLink
  ) {
    eventsLink.classList.add("nav-link-active");
  }

  const yearEl = document.getElementById("currentYear");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await Promise.all([
    loadComponent("header", "components/header.html"),
    loadComponent("footer", "components/footer.html"),
    loadComponent("eventModalContainer", "components/event-modal.html"),
    loadComponent("messageContainer", "components/message.html"),
  ]);

  initHeaderAndFooter();
  document.dispatchEvent(new Event("componentsLoaded"));
});
