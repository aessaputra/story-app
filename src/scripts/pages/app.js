import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';
import AuthService from '../data/auth-service';
import NotificationApiService from '../data/notification-service';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;
  #currentPage = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;
    this.#initialSetup();
  }

  #initialSetup() {
    this.#setupDrawer();
    this.#updateNavLinks();
  }

  #setupDrawer() {
    if (this.#drawerButton && this.#navigationDrawer) {
      this.#drawerButton.addEventListener('click', (event) => {
        event.stopPropagation();
        this.#navigationDrawer.classList.toggle('open');
      });

      document.body.addEventListener('click', (event) => {
        if (
          this.#navigationDrawer.classList.contains('open') &&
          !this.#navigationDrawer.contains(event.target) &&
          !this.#drawerButton.contains(event.target)
        ) {
          this.#navigationDrawer.classList.remove('open');
        }
      });

      this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
          const drawerButtonStyle = window.getComputedStyle(this.#drawerButton);
          if (drawerButtonStyle.display !== 'none') {
            this.#navigationDrawer.classList.remove('open');
          }
        });
      });
    }
  }

  #updateNavLinks() {
    if (!this.#navigationDrawer) return;
    const navList = this.#navigationDrawer.querySelector('.nav-list');
    if (!navList) return;

    const isLoggedIn = AuthService.isLoggedIn();
    const userName = AuthService.getUserName();
    let navLinksHtml = `
      <li><a href="#/">Beranda</a></li>
      <li><a href="#/about">About</a></li>
    `;

    if (isLoggedIn) {
      navLinksHtml += `<li><a href="#/add">Add Story</a></li>`;
      navLinksHtml += `<li><a href="#/logout" id="logout-link">Logout (${userName || 'User'})</a></li>`;
    } else {
      navLinksHtml += `<li><a href="#/login">Login</a></li>`;
      navLinksHtml += `<li><a href="#/register">Register</a></li>`;
    }
    navList.innerHTML = navLinksHtml;

    const logoutLink = navList.querySelector('#logout-link');
    if (logoutLink) {
      logoutLink.addEventListener('click', async (event) => {
        event.preventDefault();
        if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
          try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
              await NotificationApiService.unsubscribe(subscription);
            }
          } catch (error) {
            // ignore
          }
        }
        AuthService.logout();
        this.#updateNavLinks();
        window.location.hash = '#/login';
      });
    }
  }

  async renderPage() {
    if (this.#currentPage && typeof this.#currentPage.unload === 'function') {
      try {
        this.#currentPage.unload();
      } catch (e) {}
    }

    let url = getActiveRoute();
    const isLoggedIn = AuthService.isLoggedIn();

    if (url === '/add' && !isLoggedIn) {
      window.location.hash = '#/login';
      return;
    }
    if ((url === '/login' || url === '/register') && isLoggedIn) {
      window.location.hash = '#/';
      return;
    }
    if (url === '/logout') {
      const logoutLinkHandler = this.#navigationDrawer.querySelector('#logout-link');
      if (logoutLinkHandler) {
         logoutLinkHandler.click();
      } else {
        if (isLoggedIn) AuthService.logout();
        window.location.hash = '#/login';
      }
      return;
    }
    
    let page = routes[url];
    if (!page) {
      window.location.hash = '#/404';
      return; 
    }
    if (!page) {
        if (this.#content) this.#content.innerHTML = "<h1>Critical Error</h1><p>The application routing is broken.</p>";
        this.#currentPage = null;
        this.#updateNavLinks();
        return;
    }

    this.#currentPage = page;

    const renderContent = async () => {
      if (!this.#content || !this.#currentPage) return;
      this.#content.innerHTML = await this.#currentPage.render();
      if (typeof this.#currentPage.afterRender === 'function') {
        await this.#currentPage.afterRender();
      }
      const currentHash = window.location.hash;
      const activeElement = document.activeElement;
      if (currentHash === '#main-content') {
        if (this.#content) this.#content.focus();
      } else if (
        activeElement === document.body ||
        (this.#content && activeElement && !this.#content.contains(activeElement) &&
         !activeElement.closest('header') &&
         !activeElement.closest('.navigation-drawer') &&
         activeElement !== this.#drawerButton)
      ) {
        window.scrollTo(0, 0);
      }
    };

    if (document.startViewTransition) {
      document.startViewTransition(renderContent);
    } else {
      await renderContent();
    }
    this.#updateNavLinks();
  }
}

export default App;