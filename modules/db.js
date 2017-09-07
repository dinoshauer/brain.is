'use strict';
const mongojs = require('mongojs');
const flatten = require('flatten-obj')();

let that;

module.exports = () => {
  if (that) return that;

  const db = mongojs(process.env.MONGODB_URI, ['brains']);
  that = { brains: {} };

  db.brains.createIndex({ name: 1, id: 1 }, { unique: true });

  that.brains.getAll = (name, cb) =>
    db.brains.find({}, cb);

  that.brains.getAllByName = (name, cb) =>
    db.brains.find({
      user_id: userId,
      team_id: teamId,
      tomato_id: tomatoId
    }, { _id: 0 }, cb);

  that.brains.save = (name, id, data, cb) =>
    db.brains.update({
      name,
      id
    }, {
      $set: flatten(data),
      $setOnInsert: { created_at: new Date() }
    }, {
      upsert: true
    }, cb);

  return that;
};
