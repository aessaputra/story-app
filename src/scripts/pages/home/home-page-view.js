import StoryApiModel from '../../data/story-api-model';
import HomePagePresenter from './home-page-presenter';
import { showFormattedDate } from '../../utils';
import { IndexedDBService } from '../../data/indexeddb-service';
import AuthService from '../../data/auth-service';

function createStoryItemTemplate(story) {
  const descriptionPreview = story.description
    ? story.description.substring(0, 100) +
      (story.description.length > 100 ? '...' : '')
    : 'No description available.';
  const storyName = story.name || 'Anonymous User';

  return `
    <article class="story-item" id="story-${
      story.id
    }" tabindex="0" role="group" aria-labelledby="story-title-${story.id}">
      <img src="${
        story.photoUrl
      }" alt="Story image from ${storyName}: ${descriptionPreview.substring(
    0,
    30
  )}" class="story-item__image">
      <div class="story-item__content">
        <h3 class="story-item__title" id="story-title-${
          story.id
        }">${storyName}</h3>
        <p class="story-item__date">Posted: ${showFormattedDate(
          story.createdAt
        )}</p>
        <p class="story-item__description">${descriptionPreview}</p>
        ${
          typeof story.lat === 'number' && typeof story.lon === 'number'
            ? `<div id="map-${story.id}" class="story-item__map" style="height: 200px; width: 100%; margin-top:10px;" tabindex="-1" aria-label="Map location for story by ${storyName}"></div>`
            : '<p class="story-item__no-map">Location data not available for this story.</p>'
        }
        
        <div style="display: flex; gap: 10px; margin-top: 10px;">
          <button 
            class="button-save-cache" 
            data-story-id="${story.id}" 
            aria-label="Save story by ${storyName} to cache"
            style="background-color: #28a745; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; font-size: 0.9rem;"
          >
            Simpan ke Cache
          </button>
          <button 
            class="button-delete-cache" 
            data-story-id="${story.id}" 
            aria-label="Delete story by ${storyName} from cache"
            style="background-color: #e74c3c; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; font-size: 0.9rem;"
          >
            Hapus dari Cache
          </button>
        </div>
      </div>
    </article>
  `;
}

export default class HomePageView {
  constructor() {
    this._storyApiModel = StoryApiModel;
    this._presenter = new HomePagePresenter({
      view: this,
      storyApiModel: this._storyApiModel,
    });
    this._storiesListElement = null;
    this._maps = {};
    this._storyItems = [];
    this._clearCacheButtonClickHandler = null;
    this._handleStoryItemClick = this._handleStoryItemClick.bind(this);
  }

  render() {
    return `
      <section class="container stories-container">
        <h1>Shared Stories</h1>
        <div id="stories-list" class="stories-list">
          </div>
        <button id="clear-cache-button" style="display: block; margin: 20px auto; padding: 10px; background-color: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;">Clear All Cached Stories (IDB)</button>
        <button id="refresh-stories-button" style="display: block; margin: 10px auto; padding: 10px; background-color: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">Refresh Stories from API</button>
      </section>
    `;
  }

  async afterRender() {
    this._storiesListElement = document.querySelector('#stories-list');
    if (!this._storiesListElement) {
      console.error(
        'Error: #stories-list element not found in HomePageView afterRender.'
      );
      return;
    }
    this._storiesListElement.addEventListener(
      'keydown',
      this._handleStoryItemKeydown.bind(this)
    );

    this._storiesListElement.addEventListener(
      'click',
      this._handleStoryItemClick
    );

    const clearCacheButton = document.querySelector('#clear-cache-button');
    if (clearCacheButton) {
      this._clearCacheButtonClickHandler = async () => {
        try {
          await IndexedDBService.clearAllStories();
          alert('All cached stories cleared! Please refresh or reload data.');
          this.displayStories([]);
        } catch (error) {
          console.error('Failed to clear all cached stories:', error);
          alert('Failed to clear all cached stories.');
        }
      };
      clearCacheButton.addEventListener(
        'click',
        this._clearCacheButtonClickHandler
      );
    }

    const refreshStoriesButton = document.querySelector(
      '#refresh-stories-button'
    );
    if (refreshStoriesButton) {
      refreshStoriesButton.addEventListener('click', () =>
        this._loadAndDisplayStories(true)
      );
    }

    await this._loadAndDisplayStories();
  }

  async _handleStoryItemClick(event) {
    const target = event.target;
    const storyId = target.dataset.storyId;

    if (!storyId) {
      return;
    }

    if (target.classList.contains('button-delete-cache')) {
      const userConfirmed = confirm(
        `Apakah Anda yakin ingin menghapus cerita (ID: ${storyId}) ini dari cache?`
      );
      if (!userConfirmed) {
        return;
      }

      try {
        await IndexedDBService.deleteStory(storyId);
        alert(`Story (ID: ${storyId}) berhasil dihapus dari cache.`);

        const storyElementToRemove = document.getElementById(
          `story-${storyId}`
        );
        if (storyElementToRemove) {
          storyElementToRemove.remove();
          this._storyItems = this._storyItems.filter(
            (item) => item.id !== `story-${storyId}`
          );
        }

        if (this._storiesListElement.childElementCount === 0) {
          if (AuthService.isLoggedIn()) {
            this._storiesListElement.innerHTML =
              '<p class="empty-message">No stories to display yet. Be the first to share!</p>';
          } else {
            this._storiesListElement.innerHTML =
              '<p class="empty-message">Please login to view stories or check your internet connection for cached data.</p>';
          }
        }
      } catch (error) {
        console.error(`Failed to delete story ${storyId} from cache:`, error);
        alert(`Gagal menghapus story (ID: ${storyId}) dari cache.`);
      }
    } else if (target.classList.contains('button-save-cache')) {
      try {
        this.showLoading('Menyimpan cerita ke cache...');
        const storyToSave = await this._storyApiModel.getStoryDetail(storyId);
        await IndexedDBService.putStory(storyToSave);
        alert(`Story (ID: ${storyId}) berhasil disimpan ke cache.`);
        this._loadAndDisplayStories();
      } catch (error) {
        console.error(`Failed to save story ${storyId} to cache:`, error);
        alert(
          `Gagal menyimpan story (ID: ${storyId}) ke cache: ${error.message}`
        );
        this.showError(
          `Gagal menyimpan story (ID: ${storyId}) ke cache: ${error.message}`
        );
      }
    }
  }

  async _loadAndDisplayStories(forceApi = false) {
    this.showLoading();
    try {
      let stories;
      if (forceApi || (navigator.onLine && AuthService.isLoggedIn())) {
        console.info('Online: Fetching stories from API');
        stories = await this._storyApiModel.getAllStories();
      } else {
        console.info(
          'Offline or not logged in: Fetching stories from IndexedDB'
        );
        stories = await IndexedDBService.getAllStories();
        if (!stories || stories.length === 0) {
          if (!AuthService.isLoggedIn()) {
            this.showError(
              'Please login to see stories. No cached data available.'
            );
          } else {
            this.showError(
              'You are offline. No cached stories available. Please connect to the internet and refresh.'
            );
          }
          return;
        }
        console.info('Stories fetched from IndexedDB');
      }
      this.displayStories(stories);
    } catch (error) {
      console.error('Error loading stories:', error);
      try {
        const cachedStories = await IndexedDBService.getAllStories();
        if (cachedStories && cachedStories.length > 0) {
          this.displayStories(cachedStories);
          alert('Could not fetch latest stories. Displaying cached data.');
          return;
        }
      } catch (idbError) {
        console.error(
          'Error fetching from IndexedDB after API failure:',
          idbError
        );
      }
      this.showError(error.message || 'Failed to retrieve stories.');
    }
  }

  showLoading(message = 'Loading stories...') {
    if (this._storiesListElement) {
      this._storiesListElement.innerHTML = `<p class="loading-message">${message}</p>`;
    }
  }

  displayStories(stories) {
    if (!this._storiesListElement) return;
    this._storyItems = [];

    if (!stories || stories.length === 0) {
      if (AuthService.isLoggedIn()) {
        this._storiesListElement.innerHTML =
          '<p class="empty-message">No stories to display yet. Be the first to share!</p>';
      } else {
        this._storiesListElement.innerHTML =
          '<p class="empty-message">Please login to view stories or check your internet connection for cached data.</p>';
      }
      return;
    }

    this._storiesListElement.innerHTML = '';
    stories.forEach((story) => {
      if (story && story.id) {
        const storyElement = document.createElement('div');
        storyElement.innerHTML = createStoryItemTemplate(story).trim();
        const articleElement = storyElement.firstChild;

        this._storiesListElement.appendChild(articleElement);
        this._storyItems.push(articleElement);
      } else {
        console.warn(
          'Skipping story due to missing ID or invalid data:',
          story
        );
      }
    });
    this._initializeMapsForStories(stories);
  }

  _initializeMapsForStories(stories) {
    if (!stories) return;
    stories.forEach((story) => {
      if (
        story &&
        story.id &&
        typeof story.lat === 'number' &&
        typeof story.lon === 'number'
      ) {
        const mapId = `map-${story.id}`;
        const mapElement = document.getElementById(mapId);

        if (mapElement && !this._maps[mapId]) {
          try {
            const osmLayer = L.tileLayer(
              'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
              {
                attribution:
                  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              }
            );

            const satelliteLayer = L.tileLayer(
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
              {
                attribution:
                  'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
              }
            );

            const topoLayer = L.tileLayer(
              'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
              {
                attribution:
                  'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
              }
            );

            const baseMaps = {
              OpenStreetMap: osmLayer,
              Satellite: satelliteLayer,
              Topographic: topoLayer,
            };

            const map = L.map(mapId, {
              focusWhenReady: false,
              keyboard: false,
              layers: [osmLayer],
            }).setView([story.lat, story.lon], 13);

            L.control.layers(baseMaps).addTo(map);

            const marker = L.marker([story.lat, story.lon]).addTo(map);
            marker.bindPopup(
              `<b>${story.name || 'Story Location'}</b><br>${
                story.description
                  ? story.description.substring(0, 50) + '...'
                  : ''
              }`
            );

            marker.on('add', () => {
              const markerElement = marker.getElement();
              if (markerElement) {
                markerElement.setAttribute('tabindex', '-1');
              }
            });
            this._maps[mapId] = { map, marker };

            setTimeout(() => {
              if (map && map.invalidateSize) {
                map.invalidateSize(true);
              }
            }, 150);
          } catch (e) {
            console.error(`Failed to initialize map for story ${story.id}:`, e);
            if (mapElement)
              mapElement.innerHTML =
                '<p class="map-error">Could not load map.</p>';
          }
        }
      }
    });
  }

  _handleStoryItemKeydown(event) {
    const target = event.target.closest('.story-item');
    if (!target) return;

    const currentIndex = this._storyItems.indexOf(target);
    if (currentIndex === -1) return;

    if (event.key === 'Tab' && !event.shiftKey) {
      if (currentIndex < this._storyItems.length - 1) {
        event.preventDefault();
        this._storyItems[currentIndex + 1].focus();
      }
    } else if (event.key === 'Tab' && event.shiftKey) {
      if (currentIndex > 0) {
        event.preventDefault();
        this._storyItems[currentIndex - 1].focus();
      }
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (
        event.target.classList.contains('button-delete-cache') ||
        event.target.classList.contains('button-save-cache')
      ) {
        return;
      }
      this._activateStoryItemInteractiveElements(target);
    }
  }

  _activateStoryItemInteractiveElements(storyItemElement) {
    const mapId = storyItemElement.querySelector('.story-item__map')?.id;
    if (mapId && this._maps[mapId] && this._maps[mapId].marker) {
      const markerElement = this._maps[mapId].marker.getElement();
      if (markerElement) {
        markerElement.setAttribute('tabindex', '0');
        markerElement.focus();
      }
    } else {
      const firstInteractive = storyItemElement.querySelector(
        'a[href], button:not(.button-delete-cache):not(.button-save-cache), input, textarea, select, [tabindex="0"]:not(.button-delete-cache):not(.button-save-cache)'
      );
      if (firstInteractive) {
        firstInteractive.focus();
      }
    }
  }

  showError(message) {
    if (this._storiesListElement) {
      this._storiesListElement.innerHTML = `<p class="error-message">Error: ${message}</p>`;
    }
  }

  unload() {
    if (this._storiesListElement) {
      this._storiesListElement.removeEventListener(
        'keydown',
        this._handleStoryItemKeydown.bind(this)
      );
      this._storiesListElement.removeEventListener(
        'click',
        this._handleStoryItemClick
      );
    }
    const clearCacheButton = document.querySelector('#clear-cache-button');
    if (clearCacheButton && this._clearCacheButtonClickHandler) {
      clearCacheButton.removeEventListener(
        'click',
        this._clearCacheButtonClickHandler
      );
    }
    this._clearCacheButtonClickHandler = null;

    const refreshStoriesButton = document.querySelector(
      '#refresh-stories-button'
    );
    if (refreshStoriesButton) {
      refreshStoriesButton.removeEventListener('click', () =>
        this._loadAndDisplayStories(true)
      );
    }

    Object.values(this._maps).forEach((mapData) => {
      if (mapData && mapData.map && mapData.map.remove) {
        mapData.map.remove();
      }
    });
    this._maps = {};
    this._storyItems = [];
    console.info('HomePageView unloaded, maps and listeners cleaned up.');
  }
}
