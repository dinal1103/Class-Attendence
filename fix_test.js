const axios = require('axios');
axios.put('http://localhost:5000/api/classes/69e10517ab2edf878b7ea4a2/archive', {}, {
  headers: {
    // Need a valid token. Better yet, let me just add a debug log in the backend.
  }
});
