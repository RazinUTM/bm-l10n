// helpers as in a course page
function L2(en,ms){return ST.lang==="ms"?ms:en}
function tx(el,en,ms){el.setAttribute("data-en",en);el.setAttribute("data-ms",ms);el.textContent=L2(en,ms)}
var re=/"(?:[^"\\]|\\.)*"/g;            // a regex literal holding quotes must not confuse the scanner
var a=L2("Correct.","Betul.");
var b=L2("Score "+c+" / "+n+" answered","Skor "+c+" / "+n+" dijawab")+(P.t1?L2(" · time "," · masa "):"");
tx(document.getElementById("nstat"),n+" of 8 sections read","Bahagian dibaca: "+n+" daripada 8");
tx(shint,"The PDF could not be saved here.","PDF tidak dapat disimpan di sini.");
var t=L2({auto:"Theme: automatic",dark:"Theme: dark"}[ST.theme],{auto:"Tema: automatik",dark:"Tema: gelap"}[ST.theme]);
var u=L2(["(a) load on ABC","(b) load on CD"][i],["(a) load pada ABC","(b) load pada CD"][i]);
var v=L2(el.getAttribute("data-en"),el.getAttribute("data-ms"));
var w=`<b>${L2("Done","Selesai")}</b>`;
var Q=[{q:["The mass is at halt 5. Which is true?","Jisim berada di halt 5. Yang mana benar?"],o:[["it doubles","ia berganda"],["R_A","R_B"]],keys:["R_C","R_E"]}];
var next={en:"Lab · checklist ("+p.lab[0]+" of 7 items)",ms:"Makmal · senarai semak ("+p.lab[0]+" daripada 7 item)"};
var res=L2("Sum = <b class='num'>"+f2(s)+" kgf</b> against "+f2(m)+" kgf ("+(ok?"Acceptable.":"Check.")+")","Jumlah = <b class='num'>"+f2(s)+" kgf</b> berbanding "+f2(m)+" kgf ("+(ok?"Boleh diterima.":"Semak.")+")");
var thin=L2("R = 0.5 w","R = 0.5 w");
