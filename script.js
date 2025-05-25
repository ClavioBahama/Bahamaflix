// Dropdown functionality
document.querySelectorAll('.dropdown').forEach(item => {
    item.addEventListener('click', function() {
        const dropdownMenu = this.querySelector('.dropdown-menu');
        dropdownMenu.classList.toggle('show');
    });
});

// Search functionality (example implementation)
document.getElementById('search-btn').addEventListener('click', function() {
    const searchTerm = document.getElementById('search-input').value;
    alert('Buscando por: ' + searchTerm);
});

// Função para criar um cookie
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
}

// Função para ler um cookie
function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// Função para excluir um cookie
function deleteCookie(name) {
    document.cookie = name + '=; Max-Age=-99999999; path=/';
}

