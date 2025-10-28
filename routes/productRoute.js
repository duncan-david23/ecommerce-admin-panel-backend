import express from 'express';
import { addProduct, updateProduct, uploadMiddleware, getProducts, deleteProduct } from '../controllers/productController.js';


const router = express.Router();

router.get('/products', getProducts);
router.post('/products/add-product', uploadMiddleware, addProduct);
router.put('/products/:id', uploadMiddleware, updateProduct);
router.delete('/products', deleteProduct);

export default router;
