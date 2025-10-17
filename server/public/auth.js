async function doLogin() {
  const email = $("#loginEmail").value.trim();
  const password = $("#loginPass").value;
  try {
    await apiPost("/api/auth/login", { email, password });
    alert("Logged in!");
    paintAuthArea();
  } catch (e) {
    alert("Login failed: " + e.message);
  }
}

async function doRegister() {
  const name = $("#regName").value.trim();
  const email = $("#regEmail").value.trim();
  const password = $("#regPass").value;
  try {
    await apiPost("/api/auth/register", { name, email, password });
    alert("Registered & logged in!");
    paintAuthArea();
  } catch (e) {
    alert("Register failed: " + e.message);
  }
}

async function doLogout() {
  try {
    await apiPost("/api/auth/logout");
    alert("Logged out.");
    paintAuthArea();
  } catch (e) {
    alert("Logout failed: " + e.message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  $("#btnLogin").addEventListener("click", doLogin);
  $("#btnRegister").addEventListener("click", doRegister);
  $("#btnLogout").addEventListener("click", doLogout);
});
