import Router from '@koa/router';
import * as booksController from '../controllers/books.js';

const router = new Router({ prefix: '/books' });

router.get('/', booksController.listBooks);
router.get('/:id', booksController.getBook);
router.post('/', booksController.createBook);
router.put('/:id', booksController.updateBook);
router.delete('/:id', booksController.deleteBook);

export default router;
