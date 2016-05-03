'use strict';
const giphyApi = require('giphy-api');
const path = require('path');
const Hapi = require('hapi');
const vision = require('vision');
const handlebars = require('handlebars');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: './brain.env' });
}

const giphy = giphyApi({
  apiKey: process.env.GIPHY_API_KEY,
  https: true
});
const server = new Hapi.Server();

server.register({
  register: vision
}, err => {
  if (err) throw err;
});

server.views({
  engines: {
    html: handlebars
  },
  relativeTo: path.join(__dirname),
  path: 'dist'
});

server.connection({ port: process.env.PORT || 3000 });
server.start((err) => {
  if (err) throw err;
  console.log('Server running at:', server.info.uri);
});

server.route({
  method: 'GET',
  path: '/',
  handler: (request, reply) => {
    let thing = 'dev';
    if (process.env.NODE_ENV === 'production') {
      thing = request.info.host.split('.')[0];
    }
    reply.view('index.html', { thing });
  }
});

server.route({
  method: 'GET',
  path: '/{query*}',
  handler: (request, reply) => {
    const query = request.params.query.replace('/', ' ');
    giphy.search(query, (err, res) => {
      if (err) throw err;
      if (res.data.length === 0) return reply('Oh no crap.\n');

      const index = Math.floor(Math.random() * (res.data.length - 0));

      reply.view('video.html', {
        path: request.params.query,
        gif: res.data[index].images.looping.mp4,
        still: res.data[index].images.original_still.url
      });
    });
  }
});
