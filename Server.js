import express from 'express';
import cors from 'cors';
import productRoute from './routes/productRoute.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/ecommerce', productRoute);



app.get('/', (req, res) => {
  res.send('E-commerce Admin Backend is running');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});