import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import apiRouter from './routes/index.js';
import { errorHandler } from './utils/errorHandler.js';

const app = new Koa();

app.use(errorHandler());
app.use(bodyParser());
app.use(apiRouter.routes());
app.use(apiRouter.allowedMethods());

export default app;
