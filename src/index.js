//Import
import axios from 'axios';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import Notiflix from 'notiflix';

const form = document.querySelector('.search-form');
const gallery = document.querySelector('.gallery');
const infiniteScroll = document.querySelector('.js-scroll');

const BASE_URL = 'https://pixabay.com/api/';
const API_KEY = '41564235-b9b3b0b401bd21d391a887255';

let page = 1;
let totalPage = 0;
const itemsOnPage = 40;
let currentSearch = '';

const searchParamsDefault = new URLSearchParams({
  key: API_KEY,
  q: '',
  image_type: 'photo',
  orientation: 'horizontal',
  safesearch: true,
  per_page: itemsOnPage,
  page: page,
});

Notiflix.Notify.init({
  position: 'center-top',
  distance: '45px',
  timeout: 2000,
  cssAnimationStyle: 'zoom',
  fontFamily: 'Arial, sans-serif',
});

let lightbox;
let options = {
  root: null,
  rootMargin: '200px',
  threshold: 1.0,
};
let observer = new IntersectionObserver(onLoadPage, options);

function setLightbox() {
  lightbox = new SimpleLightbox('.photo-card a', {
    navText: ['&#10094;', '&#10095;'],
    captionsData: 'alt',
    captionDelay: 250,
    showCounter: false,
  });
}

async function getData(value) {
  const response = await axios.get(`
    ${BASE_URL}?${searchParamsDefault}&q=${value}
    `);
  return response.data;
}

form.addEventListener('submit', onSearch);

async function onSearch(event) {
  event.preventDefault();

  const {
    searchQuery: { value },
  } = event.currentTarget.elements;
  if (value.trim() === '') {
    gallery.innerHTML = '';
    return notFoundMassage();
  }
  currentSearch = value;
  page = 1;
  gallery.innerHTML = '';
  await renderData();
  observer.observe(infiniteScroll);
  setLightbox();
}

async function renderData() {
  try {
    searchParamsDefault.set('page', page);
    const data = await getData(currentSearch);
    const { hits, totalHits } = data;
    totalPage = Math.ceil(totalHits / itemsOnPage);

    if (hits.length === 0) {
      return notFoundMassage();
    }
    if (page === 1) {
      Notiflix.Notify.success(`Hooray! We found ${totalHits} images.`);
    }
    gallery.insertAdjacentHTML('beforeend', getMarkupItem(hits));
  } catch (error) {
    console.error(error.massage);
  }
}

// функция для рендера одной карточки картинки
function getMarkupItem(arr) {
  const photoCard = arr
    .map(
      ({
        tags,
        largeImageURL,
        webformatURL,
        views,
        downloads,
        likes,
        comments,
      }) => `
            
            <div class="photo-card">
                <a href="${largeImageURL}">
                    <img src="${webformatURL}" alt="${tags}" loading="lazy" />
                </a>
                <div class="info">
                    <p class="info-item">
                        <b>Likes</b>
                        ${likes}
                    </p>
                    <p class="info-item">
                        <b>Views</b>
                        ${views}
                    </p>
                    <p class="info-item">
                        <b>Comments</b>
                        ${comments}
                    </p>
                    <p class="info-item">
                        <b>Downloads</b>
                        ${downloads}
                    </p>
                </div>
                </div>`
    )
    .join('');
  return photoCard;
}

function notFoundMassage() {
  Notiflix.Notify.failure(
    'Sorry, there are no images matching your search query. Please try again.'
  );
}

// закончились картинки
function maxFoundMassage() {
  Notiflix.Notify.warning(
    'We&#96re sorry, but you&#96ve reached the end of search results.'
  );
}

// функция плавного скрола
function smoothScroll() {
  const { height: cardHeight } =
    gallery.firstElementChild.getBoundingClientRect();

  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
}

// не заканчивающийся скролл
async function onLoadPage(entries, observer) {
  entries.forEach(async entry => {
    if (entry.isIntersecting) {
      page += 1;

      if (page > totalPage) {
        maxFoundMassage();
        observer.unobserve(infiniteScroll);
        return;
      }
      await renderData();
      smoothScroll();
      lightbox.refresh();
    }
  });
}
