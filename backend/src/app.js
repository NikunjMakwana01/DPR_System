const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const officeIPMiddleware = require('./middleware/officeIP');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');
const settingsController = require('./controllers/settingsController');

const app = express();

app.set('trust proxy', true);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'https://dpr-system.vercel.app/',
  credentials: true,
}));
// || 'http://localhost:5173'
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'DPR System API is running' });
});

app.get('/api/client-ip', settingsController.getClientIP);

app.use('/api', officeIPMiddleware, routes);

app.use(errorHandler);

module.exports = app;
