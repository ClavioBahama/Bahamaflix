// Inicializa o dropdown do Bootstrap
document.addEventListener('DOMContentLoaded', function() {
    // Inicializa todos os dropdowns
    var dropdownElementList = [].slice.call(document.querySelectorAll('[data-bs-toggle="dropdown"]'));
    var dropdownList = dropdownElementList.map(function(dropdownToggleEl) {
        return new bootstrap.Dropdown(dropdownToggleEl);
    });

    // Adiciona evento de clique para os itens do dropdown
    var dropdownItems = document.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(function(item) {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            var href = this.getAttribute('href');
            if (href) {
                window.location.href = href;
            }
        });
    });
}); 