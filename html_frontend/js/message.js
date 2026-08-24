let messageTimeout = null;

function showMessage(type, message, title = null) {
  const toast = document.getElementById("messageToast");
  const content = document.getElementById("messageToastContent");
  const icon = document.getElementById("messageToastIcon");
  const titleElement = document.getElementById("messageToastTitle");
  const text = document.getElementById("messageToastText");

  if (!toast || !content || !icon || !titleElement || !text) {
    console.error("Message component not loaded.");
    return;
  }

  clearTimeout(messageTimeout);

  const config = {
    success: {
      title: title || "Success",
      icon: "✓",
      border: "border-green-200",
      iconColor: "text-green-600",
    },

    error: {
      title: title || "Error",
      icon: "!",
      border: "border-red-200",
      iconColor: "text-red-600",
    },

    warning: {
      title: title || "Warning",
      icon: "!",
      border: "border-yellow-200",
      iconColor: "text-yellow-600",
    },

    info: {
      title: title || "Information",
      icon: "i",
      border: "border-blue-200",
      iconColor: "text-blue-600",
    },
  };

  const current = config[type] || config.info;

  content.className =
    `flex items-start gap-3 rounded-lg border bg-white p-4 shadow-lg ${current.border}`;

  icon.className = `text-xl font-bold ${current.iconColor}`;

  icon.textContent = current.icon;
  titleElement.textContent = current.title;
  text.textContent = message;

  toast.classList.remove("hidden");

  messageTimeout = setTimeout(() => {
    hideMessage();
  }, 4000);
}

function hideMessage() {
  const toast = document.getElementById("messageToast");

  if (!toast) return;

  toast.classList.add("hidden");

  clearTimeout(messageTimeout);
}

document.addEventListener("componentsLoaded", () => {
  const closeButton = document.getElementById("messageToastClose");

  if (closeButton) {
    closeButton.addEventListener("click", hideMessage);
  }
});