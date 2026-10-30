const express = require('express');
const cors = require('cors');
const routes = require('./routes/routes');
const errorHandler = require('./guards/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(routes);

app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

app.use(errorHandler);

module.exports = app;
