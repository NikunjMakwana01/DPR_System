require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { loadOfficeIPs } = require('./src/utils/officeIPCache');

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  await loadOfficeIPs();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
