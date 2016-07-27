'use strict';
const Boom = require('boom');
const giphyApi = require('giphy-api');
const path = require('path');
const lru = require('lru-cache');
const Hapi = require('hapi');
const vision = require('vision');
const inert = require('inert');
const handlebars = require('handlebars');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: './brain.env' });
}

const giphy = giphyApi({
  apiKey: process.env.GIPHY_API_KEY,
  https: true
});
const server = new Hapi.Server();
const recents = lru(20);

server.register({
  register: vision
}, err => {
  if (err) throw err;
});

server.register({
  register: inert
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

server.ext('onPreResponse', (request, reply) => {
  // Thanks https://github.com/dwyl/hapi-error
  if (!request.response.isBoom) return reply.continue();

  const statusCode = request.response.output.payload.statusCode;
  const error = request.response.output.payload.error;

  if (statusCode === 500) {
    return reply.view('error.html', {
      title: '😱！💩.',
      message: `${statusCode}!!`,
      gif: 'https://media.giphy.com/media/P4WGYjpMMPEWI/giphy-loop.mp4',
      still: 'https://media1.giphy.com/media/P4WGYjpMMPEWI/giphy_s.gif'
    });
  }

  giphy.search(error, (err, res) => {
    if (err) throw err;

    const index = Math.floor(Math.random() * (res.data.length - 0));
    return reply.view('error.html', {
      title: '😱！💩.',
      message: `¡${statusCode}!`,
      gif: res.data[index].images.looping.mp4,
      still: res.data[index].images.original_still.url
    });
  });
});

server.route({
  method: 'GET',
  path: '/static/app-icon/{param*}',
  handler: {
    directory: {
      path: 'dist/static/app-icon'
    }
  },
  config: {
    cache: {
      expiresIn: 86400000,
      privacy: 'public'
    }
  }
});

server.route({
  method: 'GET',
  path: '/favicon.ico',
  handler: {
    file: {
      path: 'dist/static/app-icon/favicon.ico'
    }
  },
  config: {
    cache: {
      expiresIn: 86400000,
      privacy: 'public'
    }
  }
});

server.route({
  method: 'GET',
  path: '/css/{param*}',
  handler: {
    directory: {
      path: 'dist/css'
    }
  }
});

server.route({
  method: 'GET',
  path: '/',
  handler: (request, reply) => {
    let thing = 'localhost:3000';
    if (process.env.NODE_ENV === 'production') {
      thing = request.info.host.split('.brain.is')[0];
    }

    const cache = recents.get(thing) || [];
    const recentThings = cache.map(item => {
      if (process.env.NODE_ENV === 'production') {
        return `${request.info.host}/${item}`;
      }
      return `${request.info.host}/${item}`;
    });
    const hasRecents = cache.length !== 0;

    reply.view('index.html', { thing, recentThings, hasRecents });
  }
});

server.route({
  method: 'GET',
  path: '/{query*}',
  handler: (request, reply) => {
    const query = request.params.query.replace(/\//g, ' ');
    giphy.search(query, (err, res) => {
      if (err) throw err;
      if (res.data.length === 0) throw Boom.notFound();

      const thing = request.info.host.split('.brain.is')[0];
      const index = Math.floor(Math.random() * (res.data.length - 0));
      const opts = {
        id: res.data[index].id,
        path: request.params.query,
        gif: res.data[index].images.looping.mp4,
        still: res.data[index].images.original_still.url,
        thing,
        query
      };

      const currentRecents = recents.get(thing) || [];
      currentRecents.push(`${query.replace(' ', '')}#${opts.id}`);
      recents.set(thing, currentRecents);

      reply.view('video.html', opts);
    });
  }
});
