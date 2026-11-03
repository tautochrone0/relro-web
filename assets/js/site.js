// Capability matrix (industry tabs, rows open, regulation filter) and the countdown.
// The matrix itself is rendered by Jekyll from _data/; this file only adds behaviour.
(function(){
  var inds = document.getElementById('inds');
  var panels = document.querySelectorAll('.panel');

  // the address bar follows the view, so it can be copied into emails and posts
  function remember(ind, key){
    if (!history.replaceState) return;
    var q = new URLSearchParams(location.search);
    q.set('ind', ind);
    if (key) q.set('std', key); else q.delete('std');
    history.replaceState(null, '', location.pathname + '?' + q + location.hash);
  }

  function filter(panel, key){
    var matrix = panel.querySelector('.matrix');
    var chips = panel.querySelector('.chips');
    var about = panel.querySelector('.about');
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
      about.textContent = 'All ' + total + ' capabilities for ' + panel.getAttribute('data-name').toLowerCase() +
        '. Choose a regulation above to narrow them down.';
    }
  }

  function show(ind){
    var shown = null;
    panels.forEach(function(p){
      var on = p.getAttribute('data-ind') === ind;
      p.hidden = !on;
      if (on) shown = p;
    });
    inds.querySelectorAll('button').forEach(function(b){
      b.setAttribute('aria-pressed', b.getAttribute('data-ind') === ind);
    });
    return shown;
  }

  panels.forEach(function(panel){
    panel.querySelector('.matrix').addEventListener('click', function(e){
      var b = e.target.closest('.toggle'); if (!b) return;
      var open = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', open);
      b.closest('tr').classList.toggle('open', open);
      document.getElementById(b.getAttribute('aria-controls')).hidden = !open;
    });
    panel.querySelector('.chips').addEventListener('click', function(e){
      var b = e.target.closest('button'); if (!b) return;
      var key = b.getAttribute('data-k');
      filter(panel, key);
      remember(panel.getAttribute('data-ind'), key);
    });
  });

  if (inds){
    inds.addEventListener('click', function(e){
      var b = e.target.closest('button'); if (!b) return;
      var panel = show(b.getAttribute('data-ind'));
      var on = panel.querySelector('.chips [aria-pressed="true"]');
      remember(panel.getAttribute('data-ind'), on && on.getAttribute('data-k'));
    });

    // /?ind=medical&std=hipaa lands on a filtered view; /?std=cra alone picks the first industry that has it
    var q = new URLSearchParams(location.search);
    var ind = (q.get('ind') || '').replace(/[^a-z0-9]/gi, '');
    var std = (q.get('std') || '').replace(/[^a-z0-9]/gi, '');
    var panel = ind && document.querySelector('.panel[data-ind="' + ind + '"]');
    if (!panel && std){
      panel = Array.prototype.find.call(panels, function(p){
        return !p.hidden && p.querySelector('.chips [data-k="' + std + '"]');
      }) || Array.prototype.find.call(panels, function(p){
        return p.querySelector('.chips [data-k="' + std + '"]');
      });
    }
    if (panel){
      show(panel.getAttribute('data-ind'));
      if (std && panel.querySelector('.chips [data-k="' + std + '"]')) filter(panel, std);
    }
  }

  var d = document.getElementById('d');
  if (d){
    var ms = new Date(d.getAttribute('data-date')) - new Date();
    if (!isNaN(ms)) d.textContent = Math.max(0, Math.ceil(ms / 86400000));
  }
})();
