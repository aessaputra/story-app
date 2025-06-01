const DB_NAME = 'story-app-db';
const DB_VERSION = 1;
const OBJECT_STORE_NAME = 'stories';

const dbPromise = new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);

  request.onerror = (event) => {
    reject(event.target.errorCode);
  };

  request.onupgradeneeded = (event) => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains(OBJECT_STORE_NAME)) {
      const objectStore = db.createObjectStore(OBJECT_STORE_NAME, { keyPath: 'id' });
      objectStore.createIndex('name', 'name', { unique: false });
      objectStore.createIndex('createdAt', 'createdAt', { unique: false });
    }
  };

  request.onsuccess = (event) => {
    resolve(event.target.result);
  };
});

const IndexedDBService = {
  async getAllStories() {
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(OBJECT_STORE_NAME, 'readonly');
      const store = transaction.objectStore(OBJECT_STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = (event) => {
        reject(event.target.errorCode);
      };
    });
  },

  async getStoryById(id) {
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(OBJECT_STORE_NAME, 'readonly');
      const store = transaction.objectStore(OBJECT_STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = (event) => {
        reject(event.target.errorCode);
      };
    });
  },

  async putStory(story) {
    if (!story || !story.id) {
      return Promise.reject('Story or story.id is undefined');
    }
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(OBJECT_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(OBJECT_STORE_NAME);
      const request = store.put(story);

      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = (event) => {
        reject(event.target.errorCode);
      };
    });
  },

  async putAllStories(stories) {
    if (!stories || !Array.isArray(stories)) {
      return Promise.reject('Invalid stories data for putAllStories');
    }
    const validStories = stories.filter(story => story && story.id);
    if (validStories.length === 0) {
      return Promise.resolve();
    }

    const db = await dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(OBJECT_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(OBJECT_STORE_NAME);
      let completedOperations = 0;
      let erroredOperations = 0;

      validStories.forEach(story => {
        const request = store.put(story);
        request.onsuccess = () => {
          completedOperations++;
          if (completedOperations + erroredOperations === validStories.length) {
            if (erroredOperations > 0) {
              reject(new Error(`Failed to put ${erroredOperations} stories into IDB.`));
            } else {
              resolve();
            }
          }
        };
        request.onerror = () => {
          erroredOperations++;
          if (completedOperations + erroredOperations === validStories.length) {
            reject(new Error(`Failed to put ${erroredOperations} stories into IDB.`));
          }
        };
      });

      transaction.onerror = (event) => {
        reject(event.target.errorCode);
      };
    });
  },

  async deleteStory(id) {
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(OBJECT_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(OBJECT_STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = (event) => {
        reject(event.target.errorCode);
      };
    });
  },

  async clearAllStories() {
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(OBJECT_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(OBJECT_STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };
      request.onerror = (event) => {
        reject(event.target.errorCode);
      };
    });
  }
};

export { IndexedDBService };