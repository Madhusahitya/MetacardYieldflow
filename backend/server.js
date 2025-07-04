require('dotenv').config();
const express = require('express');
const cors = require('cors');
const circleRoutes = require('./routes/circle');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/circle', circleRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});