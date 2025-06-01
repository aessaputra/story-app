export default class NotFoundPage {
  async render() {
    return `
      <section class="container" style="text-align: center; padding-top: 50px; padding-bottom: 50px;">
        <h1>404 - Page Not Found</h1>
        <p>Oops! The page you are looking for does not exist.</p>
        <p><a href="#/">Go back to Home</a></p>
      </section>
    `;
  }

  async afterRender() {
    window.scrollTo(0, 0);
  }

  unload() {
    //
  }
}