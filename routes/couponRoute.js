import express from 'express'
import { addCoupon, getCoupons, applyCoupon, deleteCoupon } from '../controllers/couponController.js';

const router = express.Router();

// Placeholder for future ecommerce routes

router.post('/add-coupon', addCoupon);
router.get('/get-coupons', getCoupons);
router.post('/apply-coupon', applyCoupon);
router.delete('/delete-coupon', deleteCoupon);

export default router;