document.addEventListener("DOMContentLoaded", () => {
  let targetUrl = "index.html";

  if (window.location.protocol === "file:") {
    const path = window.location.pathname.replace(/\\/g, "/");
    const htdocsIndex = path.toLowerCase().indexOf("/htdocs/");
    if (htdocsIndex !== -1) {
      const dir = path.substring(
        htdocsIndex + "/htdocs/".length,
        path.lastIndexOf("/")
      );
      targetUrl = `http://localhost/${dir}/index.html`;
    } else {
      targetUrl = "http://localhost/event_manager/html_frontend/index.html";
    }
  }

  const enterNowLink = document.getElementById("enterNowLink");
  if (enterNowLink) {
    enterNowLink.href = targetUrl;
  }

  setTimeout(() => {
    window.location.href = targetUrl;
  }, 2000);
});
