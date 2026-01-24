import Router from '@koa/router';
import booksRouter from './books.js';

const apiRouter = new Router({ prefix: '/api/v1' });

apiRouter.use(booksRouter.routes());
apiRouter.use(booksRouter.allowedMethods());

export default apiRouter;
