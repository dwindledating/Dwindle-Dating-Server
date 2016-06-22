var express = require('express');
var router = express.Router();

/* GET users listing. */


router.get('/users/:name', function(req, res, next) {
  var nam=req.params.name;
  res.send('respond with a resource '+nam);
});

module.exports = router;
