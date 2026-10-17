const express = require('express');
const cors = require('cors');

const helmet = require('helmet');

const authRoutes = require('./routes/auth.routes');
const newsRoutes = require('./routes/news.routes');
const serverRoutes = require('./routes/server.routes');
const modsRoutes = require('./routes/mods.routes');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/server', serverRoutes);
app.use('/api/mods', modsRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = app;
