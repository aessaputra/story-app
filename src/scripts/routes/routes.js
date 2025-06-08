import HomePageView from '../pages/home/home-page-view';
import AboutPage from '../pages/about/about-page';
import AddStoryPageView from '../pages/add-story/add-story-page-view';
import LoginPageView from '../pages/login/login-page-view';
import RegisterPageView from '../pages/register/register-page-view';
import NotFoundPage from '../pages/not-found-page';
import CachedStoriesPageView from '../pages/cached-stories/cached-stories-page-view';

const routes = {
  '/': new HomePageView(),
  '/login': new LoginPageView(),
  '/register': new RegisterPageView(),
  '/add': new AddStoryPageView(),
  '/about': new AboutPage(),
  '/cached-stories': new CachedStoriesPageView(),
  '/404': new NotFoundPage(),
};

export default routes;
