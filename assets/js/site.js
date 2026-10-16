// Capability matrix (rows open, regulation filter) and the countdown.
// The matrix itself is rendered by Jekyll from _data/; this file only adds behaviour.
(function(){
  var matrix = document.getElementById('matrix');
  var chips = document.getElementById('chips');
  var about = document.getElementById('about');

  if (matrix){
    matrix.addEventListener('click', function(e){
      var b = e.target.closest('.toggle'); if (!b) return;
      var open = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', open);
      b.closest('tr').classList.toggle('open', open);
      document.getElementById(b.getAttribute('aria-controls')).hidden = !open;
    });
  }

  function filter(key){
    if (!matrix || !chips) return;
    var hits = 0;
    matrix.querySelectorAll('tr.row, tr.detail').forEach(function(tr){
      var match = !key || tr.getAttribute('data-std').split(' ').indexOf(key) > -1;
      tr.classList.toggle('dim', !match);
      if (match && tr.classList.contains('row')) hits++;
    });
    matrix.querySelectorAll('[data-k]').forEach(function(el){
      el.classList.toggle('active', !!key && el.getAttribute('data-k') === key);
    });
    var chosen = null;
    chips.querySelectorAll('button').forEach(function(b){
      var on = b.getAttribute('data-k') === (key || '');
      b.setAttribute('aria-pressed', on);
      if (on && key) chosen = b;
    });
    var total = about.getAttribute('data-total');
    about.innerHTML = '';
    if (chosen){
      var name = document.createElement('b'); name.textContent = chosen.textContent + '. ';
      var count = document.createElement('b'); count.textContent = hits + ' of ' + total;
      about.append(name, chosen.getAttribute('data-about') + ' ', count, ' capabilities answer it.');
    } else {
      about.textContent = 'All ' + total + ' capabilities. Choose a regulation above to narrow them down.';
    }
  }

  if (chips){
    chips.addEventListener('click', function(e){
      var b = e.target.closest('button'); if (!b) return;
      filter(b.getAttribute('data-k'));
    });
    // /?std=cra lands on a filtered view, handy for links in emails and posts
    var q = new URLSearchParams(location.search).get('std');
    if (q && chips.querySelector('[data-k="' + q.replace(/[^a-z0-9]/gi, '') + '"]')) filter(q);
  }

  var d = document.getElementById('d');
  if (d){
    var ms = new Date(d.getAttribute('data-date')) - new Date();
    if (!isNaN(ms)) d.textContent = Math.max(0, Math.ceil(ms / 86400000));
  }
})();
