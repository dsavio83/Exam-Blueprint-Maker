const bcrypt = require('bcryptjs');
const hash = '$2b$10$aSObX1jkG.Lco6WMmZl6YOMuJJC7warf40gzlbJo1Nn8Hb5oy13hS';
bcrypt.compare('admin', hash).then(res => console.log('Match:', res));
