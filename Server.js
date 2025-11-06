import express from 'express';
import cors from 'cors';
import productRoute from './routes/productRoute.js';
import newsletterRoute from './routes/newsletterRoute.js';
import messageRouter from './routes/messageRouter.js';
import accountSettingsRouter from './routes/accountSettingsRoute.js';
import couponRoute from './routes/couponRoute.js'

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/ecommerce', productRoute);
app.use('/api/newsletter', newsletterRoute);
app.use('/api/messages', messageRouter);
app.use('/api/settings', accountSettingsRouter)
app.use('/api/coupons', couponRoute)



app.get('/', (req, res) => {
  res.send('E-commerce Admin Backend is running');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});