document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("loginForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      const message = document.getElementById("message");
      const loginBtn = document.getElementById("loginBtn");

      try {
        loginBtn.textContent = "Signing In...";
        loginBtn.disabled = true;

        const response = await fetch(
          "http://localhost/management_project/backend/login.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              email,
              password,
            }),
          },
        );

        const data = await response.json();
        loginBtn.textContent = "Sign In";
        loginBtn.disabled = false;

        if (data.status === "success") {
          message.textContent = "✅ Login successful!";
          message.className = "text-center mt-4 text-sm text-green-600";

          setTimeout(() => {
            window.location.href =
              "http://localhost/management_project/html_frontend/index.html";
          }, 1000);
        } else {
          message.textContent = `❌ ${data.message}`;
          message.className = "text-center mt-4 text-sm text-red-600";
        }
      } catch (error) {
        console.error(error);

        message.textContent = "⚠️ Unable to connect to the server.";
        message.className = "text-center mt-4 text-sm text-red-600";

        loginBtn.textContent = "Sign In";
        loginBtn.disabled = false;
      }
    });
});
