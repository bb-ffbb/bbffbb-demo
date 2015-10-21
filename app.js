#!/usr/bin/env node

var express = require('express');
var async = require('async');
var cache = require('memory-cache');
var miners = require('bbffbb-scraper').miners;

function csrf (next) {
  var csrf = cache.get('csrf');
  if (csrf === null) {
    miners.mineLicenseFormCSRF(function (err, csrf) {
      if (err) {
        next(err);
      } else {
        cache.put('csrf', csrf, 20000);
        next(null, csrf);
      }
    });
  } else {
    next(null, csrf);
  }
}

/**
   Send multiple parallel queries to ffbb.com.
*/
function mquery (queries, next) {
  csrf(function (err, csrf) {
    if (err) {
      next(err);
    } else {
      async.map(
        queries,
        function (q, next) {
          miners.mineLicenseCSRF(q, csrf, next);
        },
        function (err, licenses) {
          if (err) {
            next(err);
          } else {
            next(null, licenses);
          }
        }
      );
    }
  });
}

var api = express.Router();
api.get('/byname/:name', function (req, res, next) {
  var words = req.params.name.split(/\s+/);
  if (words.length < 2) {
    res.status(400).send('Name too short.');
    return;
  }
  var splits = [];
  for (var i = 1; i < words.length; i++) {
    splits.push([words.slice(0, i).join(' '), words.slice(i).join(' ')]);
  }
  var queries = splits.reduce(function (qs, n) {
    return qs.concat([
      { firstName: n[0], lastName: n[1], gender: 'M' },
      { firstName: n[0], lastName: n[1], gender: 'F' },
      { firstName: n[1], lastName: n[0], gender: 'F' },
      { firstName: n[1], lastName: n[0], gender: 'M' }
    ]);
  }, []);

  mquery(queries, function (err, licenses) {
    if (err) {
      next(err);
    } else {
      res.json(licenses.reduce(function (l, n) {
        return n !== null ? l.concat(n) : l;
      }, []));
    }
  });
});

api.get('/byid/:id', function (req, res, next) {
  mquery([{ nationalId: req.params.id }],
         function (err, licenses) {
           if (err) {
             next(err);
           } else {
             res.json(licenses && licenses[0]);
           }
         });
});

var app = express();
app.use(express.static('assets'));
app.use('/api', api);

app.listen(8080);
