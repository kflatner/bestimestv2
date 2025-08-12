// backend/db.js
const { LowSync, JSONFileSync } = require('lowdb');
const path = require('path');

// Always read/write the same JSON file
const adapter = new JSONFileSync(path.join(__dirname, 'database.json'));
const db = new LowSync(adapter);

// Load once
db.read();
// Default shape if empty
db.data ||= { users: [], competitions: [], results: [] };

module.exports = {
  // Return a tiny chain with only value() and push() – no custom .find()
  get: (key) => ({
    value: () => db.data[key],
    push: (item) => {
      db.data[key].push(item);
      db.write();
      // keep a dummy object to preserve prior chaining if you used .write()
      return { write: () => {} };
    },
  }),
  write: () => db.write(),
  read: () => db.read(),
  // expose data if you ever need it directly
  data: db.data,
};
