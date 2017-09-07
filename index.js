'use strict';
require('load-environment');
const express = require('express');
const bodyParser = require('body-parser');

const db = require('./modules/db')();
const giphy = require('./modules/giphy');

const app = express();
const urlEncoded = bodyParser.urlencoded({ extended: true });

app.set('view engine', 'ejs');
app.use(express.static('./static'));

app.get('/', (req, res) => {
  const name = req.get('host').split('.')[0];
  const renderAll = (err, brains) => {
    if (err) {
      console.error(`Bad mongo! ${err.message}`);
      res.render('pages/error');
    }
    res.render('pages/index', {
      brains: brains,
      name
    });
  };

  if (!name || name === 'www') return db.brains.getAll(renderAll);
  db.brains.getAllByName(name, renderAll);
});

app.get('/*', (req, res) => {
  const name = req.get('host').split('.')[0];
  const search = req.originalUrl.split('/').join(' ').trim();
  giphy.translate(search)
    .then(result => {
      if (result.meta.status !== 200) return res.send(`No. Bad. ${result.meta}`);
      if (!Object.keys(result.data).length) return res.send('No. Nothing found.');

      const data = {
        original_mp4: result.data.images.original_mp4,
        original: result.data.images.original,
        original_still: result.data.images.original_still,
        search: search.split(' ')
      };

      db.brains.save(name, result.data.id, data, (err, x) => {
        if (err) return `No. Mongo. Bad. ${err.message}`;
        res.send(result.data.images.original.url);
      });
    })
    .catch(e => {
      console.error('ERROR.', (e.response && e.response.data) || e.message );
      res.send(`No. Axios. No!`);
    });
});

app.listen(process.env.PORT, () =>
  console.log(`brain.is listening on port ${process.env.PORT}!`)
);
