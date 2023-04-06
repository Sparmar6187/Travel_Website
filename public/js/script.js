const signInLink = document.querySelector('#sign-in-link');
const modal = document.querySelector('.modal');

signInLink.addEventListener('click', () => {
  modal.style.display = 'block';
});


const closeButton = document.querySelector('.close');

closeButton.addEventListener('click', () => {
  modal.style.display = 'none';
});

window.addEventListener('click', (event) => {
  if (event.target == modal) {
    modal.style.display = 'none';
  }
});
