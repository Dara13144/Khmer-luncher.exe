require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log('====================================================');
  console.log(`[NMC CITY RP] Production API Server Live`);
  console.log(`[URL] http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`[Status] All community & game routes mounted`);
  console.log('====================================================');
});
