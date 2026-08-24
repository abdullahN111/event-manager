async function loadComponent(id, file) {
  const element = document.getElementById(id);

  if (!element) {
    console.error(`Element #${id} not found.`);
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

document.addEventListener("DOMContentLoaded", async () => {
  await loadComponent("header", "components/header.html");
  await loadComponent("footer", "components/footer.html");

  await loadComponent(
    "eventModalContainer",
    "components/event-modal.html"
  );
  await loadComponent(
    "messageContainer",
    "components/message.html"
  );

  document.dispatchEvent(new Event("componentsLoaded"));
});