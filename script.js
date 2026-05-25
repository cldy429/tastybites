function openLoginModel() {
    document.getElementById("loginModel").classList.add("active");
}

function closeLoginModel() {
    document.getElementById("loginModel").classList.remove("active");
}

function handleLogin(event) {
    event.preventDefault();
    alert("Login амжилттай!");
    closeLoginModel();
}
    
