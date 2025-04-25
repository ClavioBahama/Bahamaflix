document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.querySelector('.form-control');
  const catalogItems = document.querySelectorAll('.catalog-item');
  const noResults = document.getElementById('no-results');

  function searchItems(query) {
      if (query === '') {
          catalogItems.forEach(item => {
              item.style.display = '';
          });
          noResults.style.display = 'none';
          return;
      }

      let found = false;
      catalogItems.forEach(item => {
          const titleElement = item.querySelector('.info-box h5');
          if (titleElement) {
              const title = titleElement.textContent.trim().toLowerCase();
              if (title.includes(query)) {
                  item.style.display = '';
                  found = true;
              } else {
                  item.style.display = 'none';
              }
          }
      });

      noResults.style.display = found ? 'none' : 'block';
  }

  searchInput.addEventListener('input', function() {
      const query = this.value.trim().toLowerCase();
      searchItems(query);
  });
});
