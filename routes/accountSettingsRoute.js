import express from 'express'
import {updateProfile, fetchProfile, uploadProfileMiddleware} from '../controllers/accountSettingsController.js'



const router = express.Router();

router.put("/account-settings", uploadProfileMiddleware, updateProfile);
router.get("/account-settings", fetchProfile); // You need to implement fetchProfile in your controller



export default router