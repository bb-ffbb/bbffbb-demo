var $ = document.querySelector.bind(document);
var $$ = document.querySelectorAll.bind(document);

window.Element.prototype.append = function (jade, ns) {
  var format = /^([a-z1-6]+)((?:\.[^ #.]+|#[^ #.]+)*)(?:\s(.*))?$/i;
  var lines = jade.split('\n');
  var match = format.exec(lines[0]);
  if (!match) {
    throw new Error('Invalid tag format: ' + jade);
  }
  var tag = match[1];
  var classes = match[2].match(/\.[^#.]+/g) || [];
  var id = match[2].match(/#[^#.]+/);
  if (match[3]) {
    lines[0] = match[3];
  } else {
    lines.shift();
  }
  var html = lines.join('\n');

  var elt;
  if (ns !== undefined) {
    elt = document.createElementNS(ns, tag);
  } else {
    elt = document.createElement(tag);
  }
  for (var i = 0; i < classes.length; i++) {
    elt.classList.add(classes[i].substring(1));
  }
  if (id) {
    elt.id = id[0].substring(1);
  }
  if (html) {
    elt.innerHTML = html;
  }

  return this.appendChild(elt);
};

$('#search').onchange = function (e) {
  var $this = e.target;
  var xhr = new window.XMLHttpRequest();
  xhr.open('get', '/api/byname/' + e.target.value);
  xhr.responseType = 'json';
  xhr.onload = function (e) {
    if (xhr.response && xhr.response.length > 0) {
      var $res = $('#results');
      $res.innerHTML = '';
      xhr.response.forEach(function (l) {
        var lic = $res.append('div.license');
        if (!(new Date(l.qualificationDate.split('/').reverse().join('-')) <= new Date()))
          lic.classList.add('unrenewed')
        for (var f in l) {
          lic.append('span.' + f + ' ' + l[f] + ' ');
        }
      });
    } else {
      $this.classList.add('error');
    }
    $this.classList.remove('loading');
  };
  $this.classList.add('loading');
  xhr.send();
};

$('#search').onfocus = $('#search').onkeydown = function (e) {
  e.target.classList.remove('error');
};
