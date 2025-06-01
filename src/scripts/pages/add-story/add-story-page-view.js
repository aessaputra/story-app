import StoryApiModel from '../../data/story-api-model';
import AddStoryPagePresenter from './add-story-page-presenter';

export default class AddStoryPageView {
  constructor() {
    this._presenter = new AddStoryPagePresenter({ view: this, storyApiModel: StoryApiModel });
    this._form = null;
    this._map = null;
    this._mapMarker = null;
    this._videoStream = null;
    this._selectedPhotoFile = null;
  }

  render() {
    return `
      <section class="container add-story-container">
        <h1>Share Your Story</h1>
        <form id="add-story-form" class="add-story-form">
          <div class="form-group">
            <label for="story-description">Description:</label>
            <textarea id="story-description" name="description" rows="4" required aria-describedby="description-help"></textarea>
            <small id="description-help" class="form-text">Tell us about your story (max 255 characters).</small>
          </div>
          <div class="form-group photo-group">
            <label for="story-photo-status">Photo:</label>
            <div id="story-photo-status" aria-live="polite">No photo selected.</div>
            <div class="photo-preview-container">
                <img id="image-preview" src="#" alt="Preview of selected image" style="display:none; max-width: 100%; height: auto; margin-top: 10px;"/>
                <video id="camera-preview" style="display:none; width:100%; max-width:300px; border:1px solid #ccc;" autoplay playsinline muted></video>
            </div>
            <canvas id="photo-canvas" style="display:none;"></canvas>
            <div class="photo-controls">
                <button type="button" id="start-camera-button" class="button-camera">Use Camera</button>
                <button type="button" id="capture-photo-button" style="display:none;" class="button-capture">Capture Photo</button>
                <label for="photo-file-input" class="button-file-upload">
                    Choose File
                    <input type="file" id="photo-file-input" name="photo" accept="image/png, image/jpeg" style="display:none;">
                </label>
            </div>
          </div>
          <div class="form-group map-group">
            <label for="map-select-location">Location (click on map to select):</label>
            <div id="map-select-location" style="height: 300px; width: 100%; border:1px solid #ccc;" tabindex="0" aria-label="Map for selecting story location. Click to set coordinates."></div>
            <input type="hidden" id="latitude" name="lat" required>
            <input type="hidden" id="longitude" name="lon" required>
            <div id="selected-coords-info" aria-live="polite" style="margin-top: 5px;">Coordinates: Not selected</div>
          </div>
          <button type="submit" id="submit-story-button" class="button-submit">Submit Story</button>
          <p id="add-story-message" class="form-message" aria-live="polite"></p>
        </form>
      </section>
    `;
  }

  async afterRender() {
    this._form = document.querySelector('#add-story-form');
    this._descriptionInput = document.querySelector('#story-description');
    this._photoStatus = document.querySelector('#story-photo-status');
    this._imagePreview = document.querySelector('#image-preview');
    this._cameraPreview = document.querySelector('#camera-preview');
    this._photoCanvas = document.querySelector('#photo-canvas');
    this._startCameraButton = document.querySelector('#start-camera-button');
    this._capturePhotoButton = document.querySelector('#capture-photo-button');
    this._photoFileInput = document.querySelector('#photo-file-input');
    this._latitudeInput = document.querySelector('#latitude');
    this._longitudeInput = document.querySelector('#longitude');
    this._selectedCoordsInfo = document.querySelector('#selected-coords-info');
    this._submitButton = document.querySelector('#submit-story-button');
    this._messageElement = document.querySelector('#add-story-message');

    this._initMapSelection();
    this._initCameraControls();
    this._initFileInput();

    this._form.addEventListener('submit', async (event) => {
      event.preventDefault();
      this._submitButton.disabled = true;
      this._messageElement.textContent = '';
      const storyData = this.getStoryData();
      if (storyData) {
        await this._presenter.submitNewStory(storyData);
      }
      this._submitButton.disabled = false;
    });
  }

  _initMapSelection() {
    const mapElement = document.getElementById('map-select-location');
    if (mapElement && !this._map) {
        const defaultCoords = [-6.200000, 106.816666];
        const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        });
        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        });
        const topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
        });
        const baseMaps = {
            "OpenStreetMap": osmLayer,
            "Satellite": satelliteLayer,
            "Topographic": topoLayer
        };
        this._map = L.map(mapElement, {
            layers: [osmLayer]
        }).setView(defaultCoords, 10);
        L.control.layers(baseMaps).addTo(this._map);
        setTimeout(() => {
            if (this._map && this._map.invalidateSize) {
                this._map.invalidateSize(true);
            }
        }, 150);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userCoords = [position.coords.latitude, position.coords.longitude];
                    this._map.setView(userCoords, 13);
                    this._updateSelectedCoordinates(userCoords[0], userCoords[1]);
                    this._mapMarker = L.marker(userCoords, { draggable: true }).addTo(this._map)
                                        .bindPopup('Your current location. Drag to adjust.')
                                        .openPopup();
                    this._mapMarker.on('dragend', (e) => {
                        const { lat, lng } = e.target.getLatLng();
                        this._updateSelectedCoordinates(lat, lng);
                    });
                },
                () => {
                    this._selectedCoordsInfo.textContent = 'Could not get current location. Using default. Click map to change.';
                    this._mapMarker = L.marker(defaultCoords, { draggable: true }).addTo(this._map)
                                      .bindPopup('Default location. Drag to adjust.');
                    this._mapMarker.on('dragend', (e) => {
                        const { lat, lng } = e.target.getLatLng();
                        this._updateSelectedCoordinates(lat, lng);
                    });
                    this._updateSelectedCoordinates(defaultCoords[0], defaultCoords[1]);
                }
            );
        } else {
            this._mapMarker = L.marker(defaultCoords, { draggable: true }).addTo(this._map)
                              .bindPopup('Default location. Drag to adjust.');
            this._mapMarker.on('dragend', (e) => {
                const { lat, lng } = e.target.getLatLng();
                this._updateSelectedCoordinates(lat, lng);
            });
            this._updateSelectedCoordinates(defaultCoords[0], defaultCoords[1]);
        }
        this._map.on('click', (e) => {
            const { lat, lng } = e.latlng;
            this._updateSelectedCoordinates(lat, lng);
            if (!this._mapMarker) {
                this._mapMarker = L.marker(e.latlng, { draggable: true }).addTo(this._map)
                                    .bindPopup('Selected location. Drag to adjust.')
                                    .openPopup();
                this._mapMarker.on('dragend', (ev) => {
                    const { lat: newLat, lng: newLng } = ev.target.getLatLng();
                    this._updateSelectedCoordinates(newLat, newLng);
                });
            } else {
                this._mapMarker.setLatLng(e.latlng).openPopup();
            }
        });
    }
  }

  _updateSelectedCoordinates(lat, lon) {
    this._latitudeInput.value = lat;
    this._longitudeInput.value = lon;
    this._selectedCoordsInfo.textContent = `Coordinates: Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}`;
  }

  _initCameraControls() {
    this._startCameraButton.addEventListener('click', async () => {
      this._stopCameraStream();
      this._imagePreview.style.display = 'none';
      this._cameraPreview.style.display = 'block';
      try {
        this._videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        this._cameraPreview.srcObject = this._videoStream;
        this._capturePhotoButton.style.display = 'inline-block';
        this._startCameraButton.style.display = 'none';
        this._photoStatus.textContent = 'Camera active. Click "Capture Photo".';
        this._selectedPhotoFile = null;
      } catch (err) {
        this.showError('Could not access camera. Please check permissions and ensure your device has a camera.');
        this._cameraPreview.style.display = 'none';
        this._startCameraButton.style.display = 'inline-block';
        this._capturePhotoButton.style.display = 'none';
      }
    });

    this._capturePhotoButton.addEventListener('click', () => {
      if (!this._videoStream || !this._cameraPreview.srcObject) {
        this.showError('Camera stream not available or not ready.');
        return;
      }
      if (this._cameraPreview.videoWidth === 0 || this._cameraPreview.videoHeight === 0) {
        this.showError('Camera not ready, video dimensions are zero. Please wait a moment and try again.');
        return;
      }
      this._photoCanvas.width = this._cameraPreview.videoWidth;
      this._photoCanvas.height = this._cameraPreview.videoHeight;
      const context = this._photoCanvas.getContext('2d');
      context.drawImage(this._cameraPreview, 0, 0, this._photoCanvas.width, this._photoCanvas.height);
      this._photoCanvas.toBlob((blob) => {
        if (blob) {
          this._selectedPhotoFile = new File([blob], `capture-${Date.now()}.png`, { type: 'image/png' });
          this._photoStatus.textContent = `Photo captured: ${this._selectedPhotoFile.name}`;
          this._imagePreview.src = URL.createObjectURL(this._selectedPhotoFile);
          this._imagePreview.style.display = 'block';
          this._cameraPreview.style.display = 'none';
        } else {
          this.showError('Failed to capture photo (blob is null).');
        }
      }, 'image/png');
      this._stopCameraStream();
    });
  }

  _initFileInput() {
    this._photoFileInput.addEventListener('change', (event) => {
      if (event.target.files && event.target.files[0]) {
        this._stopCameraStream();
        this._selectedPhotoFile = event.target.files[0];
        this._photoStatus.textContent = `File selected: ${this._selectedPhotoFile.name}`;
        const reader = new FileReader();
        reader.onload = (e) => {
            this._imagePreview.src = e.target.result;
            this._imagePreview.style.display = 'block';
            this._cameraPreview.style.display = 'none';
        }
        reader.readAsDataURL(this._selectedPhotoFile);
      }
    });
  }

  _stopCameraStream() {
    if (this._videoStream) {
      this._videoStream.getTracks().forEach(track => track.stop());
      this._videoStream = null;
      if (this._cameraPreview) {
        this._cameraPreview.srcObject = null;
      }
    }
    if (this._cameraPreview) this._cameraPreview.style.display = 'none';
    if (this._capturePhotoButton) this._capturePhotoButton.style.display = 'none';
    if (this._startCameraButton) this._startCameraButton.style.display = 'inline-block';
  }

  getStoryData() {
    const description = this._descriptionInput.value.trim();
    const lat = this._latitudeInput.value;
    const lon = this._longitudeInput.value;
    if (!description) {
      this.showError('Description cannot be empty.');
      this._descriptionInput.focus();
      return null;
    }
    if (!this._selectedPhotoFile) {
      this.showError('Please select or capture a photo.');
      if (this._startCameraButton.style.display !== 'none') {
          this._startCameraButton.focus();
      } else if (this._photoFileInput) {
          document.querySelector('label[for="photo-file-input"]').focus();
      }
      return null;
    }
    if (!lat || !lon) {
      this.showError('Please select a location on the map.');
      document.getElementById('map-select-location').focus();
      return null;
    }
    const formData = new FormData();
    formData.append('description', description);
    formData.append('photo', this._selectedPhotoFile);
    formData.append('lat', parseFloat(lat));
    formData.append('lon', parseFloat(lon));
    return formData;
  }

  showLoading() {
    this._messageElement.textContent = 'Submitting your story...';
    this._messageElement.className = 'form-message loading';
  }

  showSuccess(message) {
    this._messageElement.textContent = message || 'Story added successfully!';
    this._messageElement.className = 'form-message success';
    this.clearForm();
    setTimeout(() => { window.location.hash = '#/'; }, 2000);
  }

  showError(message) {
    this._messageElement.textContent = message || 'An error occurred.';
    this._messageElement.className = 'form-message error';
  }

  clearForm() {
    if (this._form) this._form.reset();
    this._selectedPhotoFile = null;
    if (this._photoStatus) this._photoStatus.textContent = 'No photo selected.';
    if (this._imagePreview) {
        this._imagePreview.style.display = 'none';
        this._imagePreview.src = '#';
    }
    if (this._latitudeInput) this._latitudeInput.value = '';
    if (this._longitudeInput) this._longitudeInput.value = '';
    if (this._selectedCoordsInfo) this._selectedCoordsInfo.textContent = 'Coordinates: Not selected';
    if (this._mapMarker) {
        this._mapMarker.remove();
        this._mapMarker = null;
    }
    this._stopCameraStream();
    if (this._startCameraButton) this._startCameraButton.style.display = 'inline-block';
    if (this._capturePhotoButton) this._capturePhotoButton.style.display = 'none';
    if (this._cameraPreview) this._cameraPreview.style.display = 'none';
  }

  unload() {
    this._stopCameraStream();
    if (this._map && this._map.remove) {
      this._map.remove();
      this._map = null;
    }
  }
}