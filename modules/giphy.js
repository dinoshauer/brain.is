'use strict';
const axios = require('axios');
const db = require('./db');
const giphyApi = axios.create({
  baseURL: 'https://api.giphy.com',
  timeout: 1000,
});
const { GIPHY_API_KEY } = process.env;
if (!GIPHY_API_KEY) throw new Error('GIPHY_API_KEY not defined in environment!');

const getData = response => response.data;

module.exports = {
  getRandomSticker: () =>
    giphyApi.get('/v1/stickers/random', { params: { api_key: GIPHY_API_KEY } })
      .then(getData),
  search: (q) =>
    giphyApi.get('/v1/gifs/search', { params: { api_key: GIPHY_API_KEY, q } })
      .then(getData),
  translate: (s) =>
    giphyApi.get('/v1/gifs/translate', { params: { api_key: GIPHY_API_KEY, s } })
      .then(getData)
};
