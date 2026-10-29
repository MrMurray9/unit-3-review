(function(){
  "use strict";
  var Q = window.QUIZ.questions, L = ["A","B","C","D"], N = Q.length;
  var answers, hints, idx, K = atob(window.QUIZ.k);
  // Light obfuscation only: there is no server, so this just stops casual peeking.
  function ans(i){ return ((((K.charCodeAt(i) ^ 0x5A) - ((i*31+17) & 255) - 1) & 255)); }
  function info(i){
    var b = atob(Q[i].x.split("").reverse().join("")), u = new Uint8Array(b.length);
    for(var j=0;j<b.length;j++) u[j]=b.charCodeAt(j);
    var t = new TextDecoder().decode(u).split("\u241e"); return {e:t[0], ref:t[1]};
  }
  var $ = function(id){ return document.getElementById(id); };
  var el = function(tag, cls, txt){ var e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; };

  $("progressBar").setAttribute("aria-valuemax", N);
  function reset(){ answers = new Array(N).fill(null); hints = new Array(N).fill(false); idx = 0; }
  function score(){ return answers.reduce(function(s,a,i){ return s + (a!==null && a===ans(i) ? 1 : 0); },0); }
  function show(id){ ["start","quiz","results"].forEach(function(s){ $(s).hidden = (s!==id); }); }

  function render(){
    var item = Q[idx], picked = answers[idx], locked = picked !== null, A = locked ? ans(idx) : -1;
    $("progressLabel").textContent = "Question " + (idx+1) + " of " + N;
    $("scoreLabel").textContent = "Score: " + score() + " / " + answers.filter(function(a){return a!==null;}).length;
    $("progressFill").style.width = ((idx+1)/N*100) + "%";
    $("progressBar").setAttribute("aria-valuenow", idx+1);
    $("progressBar").setAttribute("aria-valuetext", "Question " + (idx+1) + " of " + N);
    $("qText").textContent = (idx+1) + ". " + item.q;

    var box = $("options"); box.innerHTML = "";
    item.o.forEach(function(opt, i){
      var b = el("button","option"); b.type="button";
      b.appendChild(el("span","letter",L[i]));
      b.appendChild(el("span","otext",opt));
      if(locked){
        b.disabled = true;
        if(i===A){ b.classList.add("correct"); b.appendChild(el("span","mark","✓ Correct answer")); }
        else if(i===picked){ b.classList.add("wrong"); b.appendChild(el("span","mark","✗ Your answer")); }
        else b.classList.add("dim");
      } else {
        b.setAttribute("aria-label", L[i] + ": " + opt);
        b.addEventListener("click", function(){ choose(i); });
      }
      box.appendChild(b);
    });

    var hb = $("hintBox");
    hb.hidden = !hints[idx];
    hb.innerHTML = ""; hb.appendChild(el("strong",null,"Hint: ")); hb.appendChild(document.createTextNode(item.h));
    $("hintBtn").disabled = locked || hints[idx];
    $("hintBtn").setAttribute("aria-expanded", hints[idx] ? "true" : "false");

    var fb = $("feedback");
    if(locked){
      var ok = picked===A, inf = info(idx);
      fb.className = "feedback " + (ok ? "ok" : "no");
      fb.innerHTML = "";
      fb.appendChild(el("strong",null, ok ? "✓ Correct!" : "✗ Not quite. The correct answer is " + L[A] + "."));
      fb.appendChild(el("span",null,inf.e));
      if(inf.ref) fb.appendChild(el("span","ref",inf.ref));
      fb.hidden = false;
    } else fb.hidden = true;

    $("prevBtn").disabled = idx===0;
    $("nextBtn").textContent = idx===N-1 ? "See results →" : "Next →";
  }

  function choose(i){
    if(answers[idx]!==null) return;
    answers[idx] = i; render();
    $("feedback").setAttribute("tabindex","-1"); $("feedback").focus({preventScroll:true});
  }
  function go(n){ idx = n; render(); $("qText").focus({preventScroll:true}); $("quiz").scrollIntoView({behavior:"smooth",block:"start"}); }

  function results(){
    var s = score(), pct = Math.round(s/N*100);
    $("finalScore").textContent = s + " / " + N;
    $("finalPct").textContent = pct + "%";
    var unanswered = answers.filter(function(a){return a===null;}).length;
    var msg = pct>=80 ? "Excellent work. You have a strong grasp of how Canada came together." :
              pct>=60 ? "Good effort. Review the questions you missed below, then try again." :
                        "Keep going. Read the explanations for the questions you missed, review Chapter 7, and retake the quiz.";
    if(unanswered) msg += " (" + unanswered + " question" + (unanswered>1?"s were":" was") + " left unanswered.)";
    $("finalMsg").textContent = msg;
    var list = $("reviewList"); list.innerHTML = "";
    Q.forEach(function(item,i){
      var li = el("li"), a = answers[i], c = ans(i);
      li.appendChild(el("div","r-q",item.q));
      var line = el("div");
      if(a===null){ line.appendChild(el("span","r-skip","— Not answered. ")); }
      else if(a===c){ line.appendChild(el("span","r-ok","✓ Correct: ")); line.appendChild(document.createTextNode(L[a]+") "+item.o[a])); line.appendChild(el("br")); }
      else { line.appendChild(el("span","r-no","✗ Your answer: ")); line.appendChild(document.createTextNode(L[a]+") "+item.o[a])); line.appendChild(el("br")); }
      if(a!==c){ line.appendChild(el("strong",null,"Correct answer: ")); line.appendChild(document.createTextNode(L[c]+") "+item.o[c])); line.appendChild(el("br")); }
      var jump = el("button",null,"Go to question"); jump.type="button";
      jump.addEventListener("click", function(){ show("quiz"); go(i); });
      line.appendChild(jump);
      li.appendChild(line); list.appendChild(li);
    });
    show("results"); $("resultsHeading").focus();
  }

  $("startBtn").addEventListener("click", function(){ show("quiz"); go(0); });
  $("prevBtn").addEventListener("click", function(){ if(idx>0) go(idx-1); });
  $("nextBtn").addEventListener("click", function(){ if(idx<N-1) go(idx+1); else results(); });
  $("hintBtn").addEventListener("click", function(){ hints[idx]=true; render(); });
  $("retakeBtn").addEventListener("click", function(){ reset(); show("quiz"); go(0); });
  document.addEventListener("keydown", function(e){
    if($("quiz").hidden || e.target.tagName==="INPUT") return;
    var k = e.key.toUpperCase(), i = L.indexOf(k);
    if(i>-1 && !e.ctrlKey && !e.metaKey && !e.altKey) choose(i);
    else if(e.key==="ArrowRight" && answers[idx]!==null) $("nextBtn").click();
    else if(e.key==="ArrowLeft") $("prevBtn").click();
  });

  reset();
})();
