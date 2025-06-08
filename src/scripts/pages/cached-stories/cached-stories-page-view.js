import { IndexedDBService } from '../../data/indexeddb-service';
import { showFormattedDate } from '../../utils';
import AuthService from '../../data/auth-service';

function createCachedStoryItemTemplate(story) {
  const descriptionPreview = story.description
    ? story.description.substring(0, 100) +
      (story.description.length > 100 ? '...' : '')
    : 'No description available.';
  const storyName = story.name || 'Anonymous User';

  return `
    <article class="story-item" id="cached-story-${
      story.id
    }" tabindex="0" role="group" aria-labelledby="cached-story-title-${
    story.id
  }">
      <img src="${
        story.photoUrl
      }" alt="Story image from ${storyName}: ${descriptionPreview.substring(
    0,
    30
  )}" class="story-item__image">
      <div class="story-item__content">
        <h3 class="story-item__title" id="cached-story-title-${
          story.id
        }">${storyName}</h3>
        <p class="story-item__date">Posted: ${showFormattedDate(
          story.createdAt
        )}</p>
        <p class="story-item__description">${descriptionPreview}</p>
        ${
          typeof story.lat === 'number' && typeof story.lon === 'number'
            ? `<div id="cached-map-${story.id}" class="story-item__map" style="height: 200px; width: 100%; margin-top:10px;" tabindex="-1" aria-label="Map location for story by ${storyName}"></div>`
            : '<p class="story-item__no-map">Location data not available for this story.</p>'
        }
        
        <button 
          class="button-delete-cached-story" 
          data-story-id="${story.id}" 
          aria-label="Delete cached story by ${storyName}"
          style="background-color: #e74c3c; color: white; border: none; padding: 8px 12px; margin-top: 10px; border-radius: 5px; cursor: pointer; font-size: 0.9rem;"
        >
          Hapus dari Simpanan
        </button>
      </div>
    </article>
  `;
}

export default class CachedStoriesPageView {
  constructor() {
    this._cachedStoriesListElement = null;
    this._maps = {};
    this._cachedStoryItems = [];
    this._handleDeleteCachedStoryClick =
      this._handleDeleteCachedStoryClick.bind(this);
  }

  render() {
    return `
      <section class="container cached-stories-container">
        <h1>Cerita Tersimpan</h1>
        <div id="cached-stories-list" class="stories-list">
          </div>
        <p id="cached-stories-message" class="form-message" aria-live="polite"></p>
        <button id="clear-all-cached-button" style="display: block; margin: 20px auto; padding: 10px; background-color: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;">Hapus Semua Cerita Tersimpan</button>
      </section>
    `;
  }

  async afterRender() {
    this._cachedStoriesListElement = document.querySelector(
      '#cached-stories-list'
    );
    this._messageElement = document.querySelector('#cached-stories-message');

    if (!this._cachedStoriesListElement) {
      console.error(
        'Error: #cached-stories-list element not found in CachedStoriesPageView afterRender.'
      );
      return;
    }

    this._cachedStoriesListElement.addEventListener(
      'click',
      this._handleDeleteCachedStoryClick
    );
    this._cachedStoriesListElement.addEventListener(
      'keydown',
      this._handleStoryItemKeydown.bind(this)
    );

    const clearAllCachedButton = document.querySelector(
      '#clear-all-cached-button'
    );
    if (clearAllCachedButton) {
      clearAllCachedButton.addEventListener('click', async () => {
        const userConfirmed = confirm(
          'Apakah Anda yakin ingin menghapus semua cerita yang tersimpan?'
        );
        if (!userConfirmed) {
          return;
        }
        try {
          await IndexedDBService.clearAllStories();
          this.showSuccess('Semua cerita tersimpan berhasil dihapus!');
          this.displayCachedStories([]);
        } catch (error) {
          console.error('Failed to clear all cached stories:', error);
          this.showError('Gagal menghapus semua cerita tersimpan.');
        }
      });
    }

    await this._loadAndDisplayCachedStories();
  }

  async _handleDeleteCachedStoryClick(event) {
    if (event.target.classList.contains('button-delete-cached-story')) {
      const storyId = event.target.dataset.storyId;
      if (!storyId) {
        console.warn('Story ID not found on delete button.');
        return;
      }

      const userConfirmed = confirm(
        `Apakah Anda yakin ingin menghapus cerita (ID: ${storyId}) ini dari simpanan?`
      );
      if (!userConfirmed) {
        return;
      }

      try {
        await IndexedDBService.deleteStory(storyId);
        this.showSuccess(
          `Story (ID: ${storyId}) berhasil dihapus dari simpanan.`
        );

        const storyElementToRemove = document.getElementById(
          `cached-story-${storyId}`
        );
        if (storyElementToRemove) {
          storyElementToRemove.remove();
          this._cachedStoryItems = this._cachedStoryItems.filter(
            (item) => item.id !== `cached-story-${storyId}`
          );
        }

        if (this._cachedStoriesListElement.childElementCount === 0) {
          this.displayCachedStories([]);
        }
      } catch (error) {
        console.error(`Failed to delete cached story ${storyId}:`, error);
        this.showError(`Gagal menghapus story (ID: ${storyId}) dari simpanan.`);
      }
    }
  }

  async _loadAndDisplayCachedStories() {
    this.showLoading('Memuat cerita tersimpan...');
    try {
      const stories = await IndexedDBService.getAllStories();
      this.displayCachedStories(stories);
    } catch (error) {
      console.error('Error loading cached stories:', error);
      this.showError(
        error.message || 'Gagal mengambil cerita tersimpan dari IndexedDB.'
      );
    }
  }

  showLoading(message) {
    if (this._messageElement) {
      this._messageElement.textContent = message;
      this._messageElement.className = 'form-message loading';
    }
    if (this._cachedStoriesListElement) {
      this._cachedStoriesListElement.innerHTML =
        '<p class="loading-message">Loading stories...</p>';
    }
  }

  showSuccess(message) {
    if (this._messageElement) {
      this._messageElement.textContent = message;
      this._messageElement.className = 'form-message success';
    }
  }

  showError(message) {
    if (this._messageElement) {
      this._messageElement.textContent = message;
      this._messageElement.className = 'form-message error';
    }
    if (this._cachedStoriesListElement) {
      this._cachedStoriesListElement.innerHTML = `<p class="error-message">Error: ${message}</p>`;
    }
  }

  displayCachedStories(stories) {
    if (!this._cachedStoriesListElement) return;
    this._cachedStoryItems = [];

    if (!stories || stories.length === 0) {
      this._cachedStoriesListElement.innerHTML =
        '<p class="empty-message">Tidak ada cerita yang tersimpan. Silakan simpan cerita dari halaman beranda!</p>';
      this.showSuccess('Tidak ada cerita yang tersimpan.');
      return;
    }
    this.showSuccess('');

    this._cachedStoriesListElement.innerHTML = '';
    stories.forEach((story) => {
      if (story && story.id) {
        const storyElement = document.createElement('div');
        storyElement.innerHTML = createCachedStoryItemTemplate(story).trim();
        const articleElement = storyElement.firstChild;

        this._cachedStoriesListElement.appendChild(articleElement);
        this._cachedStoryItems.push(articleElement);
      } else {
        console.warn(
          'Skipping story due to missing ID or invalid data:',
          story
        );
      }
    });
    this._initializeMapsForStories(stories, true);
  }

  _initializeMapsForStories(stories, isCached = false) {
    if (!stories) return;
    stories.forEach((story) => {
      if (
        story &&
        story.id &&
        typeof story.lat === 'number' &&
        typeof story.lon === 'number'
      ) {
        const mapId = isCached ? `cached-map-${story.id}` : `map-${story.id}`;
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

    const currentIndex = this._cachedStoryItems.indexOf(target);
    if (currentIndex === -1) return;

    if (event.key === 'Tab' && !event.shiftKey) {
      if (currentIndex < this._cachedStoryItems.length - 1) {
        event.preventDefault();
        this._cachedStoryItems[currentIndex + 1].focus();
      }
    } else if (event.key === 'Tab' && event.shiftKey) {
      if (currentIndex > 0) {
        event.preventDefault();
        this._cachedStoryItems[currentIndex - 1].focus();
      }
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (event.target.classList.contains('button-delete-cached-story')) {
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
        'a[href], button:not(.button-delete-cached-story), input, textarea, select, [tabindex="0"]:not(.button-delete-cached-story)'
      );
      if (firstInteractive) {
        firstInteractive.focus();
      }
    }
  }

  unload() {
    if (this._cachedStoriesListElement) {
      this._cachedStoriesListElement.removeEventListener(
        'click',
        this._handleDeleteCachedStoryClick
      );
      this._cachedStoriesListElement.removeEventListener(
        'keydown',
        this._handleStoryItemKeydown.bind(this)
      );
    }
    const clearAllCachedButton = document.querySelector(
      '#clear-all-cached-button'
    );
    if (clearAllCachedButton) {
      clearAllCachedButton.removeEventListener('click', () => {});
    }

    Object.values(this._maps).forEach((mapData) => {
      if (mapData && mapData.map && mapData.map.remove) {
        mapData.map.remove();
      }
    });
    this._maps = {};
    this._cachedStoryItems = [];
    console.info(
      'CachedStoriesPageView unloaded, maps and listeners cleaned up.'
    );
  }
}
