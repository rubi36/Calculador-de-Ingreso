/* Local PDF generator: no network, no external dependencies. */
function makeReportPDF(kind) {
  const week = kind === 'Week', monthly = kind === 'Month';
  const key = (week ? weekReportSelect : monthly ? monthReportSelect : yearReportSelect).value;
  const rows = (week ? recordsForWeek(key) : monthly ? recordsForMonth(key) : recordsForYear(key)).slice().sort((a,b)=>a.date.localeCompare(b.date));
  const totals = calcTotals(rows), title = week ? 'Reporte semanal' : monthly ? 'Reporte mensual' : 'Reporte anual';
  const period = week ? weekLabel(key) : monthly ? monthLabel(key) : key;
  const W = week ? 164.41 : 595.28, margin = week ? 9 : 36, font = week ? 7 : 10;
  const H = week ? Math.min(1200, Math.max(230, 145 + rows.length*30 + Object.keys(groupByDay(rows)).length*55)) : 841.89;
  const pages = []; let commands = [], y = 0;
  const literal = text => '(' + Array.from(String(text), c=> {const n=c.charCodeAt(0); return n>255?'?':n<32||n>126||c==='('||c===')'||c==='\\'?'\\'+n.toString(8).padStart(3,'0'):c;}).join('') + ')';
  const width = (s,size) => Array.from(String(s)).reduce((a,c)=>a+("ilI.,:;'!|".includes(c)?0.25:"MW@%".includes(c)?0.9:0.57),0)*size;
  function text(s,x,yy,size=font,bold=false,right=false) { if(right)x-=width(s,size); commands.push(`BT /${bold?'F2':'F1'} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${(H-yy).toFixed(2)} Tm ${literal(s)} Tj ET`); }
  function line(){commands.push(`0.4 w ${margin} ${(H-y).toFixed(2)} m ${(W-margin).toFixed(2)} ${(H-y).toFixed(2)} l S`); y+=8;}
  function start(){ commands=[]; y=margin+10; text('PALM SPRINGS BAKERY',margin,y,week?9:18,true); y+=week?13:25; text(title+' - '+period,margin,y,week?7:12,true); y+=week?12:20; text('Impreso: '+formatFullDate(new Date()),margin,y,week?6:9); y+=12; line(); }
  function ensure(h){if(y+h>H-margin){pages.push(commands.join('\n')); start(); if(!week) header();}}
  function wrap(s,max,size=font){let result=[],str=''; for(const word of String(s).split(/\s+/)){if(str&&width(str+' '+word,size)>max){result.push(str);str='';} for(const ch of word){if(str&&width(str+ch,size)>max){result.push(str);str='';}str+=ch;}str+=' ';} if(str.trim())result.push(str.trim());return result.length?result:[''];}
  const cols = monthly ? [margin,margin+65, W-185,W-108,W-margin] : [margin,W-400,W-310,W-220,W-120,W-margin];
  function header(){if(week)return; const labels=monthly?['Fecha','Producto','Cant.','Precio','Importe']:['Mes','Pasteles','$ Pasteles','Masas','$ Masas','Total']; labels.forEach((v,i)=>text(v,cols[i],y,9,true,i>=2||(!monthly&&i===1))); y+=13; line();}
  function summary(t){ensure(65); line(); text('TOTAL '+(week?'SEMANA':monthly?'DEL MES':'DEL AÑO'),margin,y,font+1,true);y+=13; for(const [label,val] of [['Pasteles: '+numberDisplay(t.pastriesQty),money(t.pastriesMoney)],['Masas: '+numberDisplay(t.masasQty),money(t.masasMoney)],['Total $:',money(t.totalMoney)]]){text(label,margin,y,font,true);text(val,W-margin,y,font,true,true);y+=12;}}
  start();
  if(week){for(const [date,items] of Object.entries(groupByDay(rows))){ensure(34);text(weekdayName(date).toUpperCase()+' '+formatShortDate(date),margin,y,font,true); y+=12;for(const r of items){const name=wrap(r.product,W-2*margin-68);ensure(name.length*9+5); name.forEach((v,i)=>text(v,margin,y+i*9));text(numberDisplay(r.quantity),W-margin-48,y,font,false,true);text(money(r.quantity*r.price),W-margin,y,font,false,true);y+=name.length*9+3;}const t=calcTotals(items);ensure(30);text('Pasteles: '+numberDisplay(t.pastriesQty),margin,y);y+=10;text('Masas: '+numberDisplay(t.masasQty),margin,y);y+=10;line();}}
  else {header(); if(monthly){for(const r of rows){const name=wrap(r.product,cols[2]-cols[1]-36);ensure(name.length*13+6);text(formatShortDate(r.date),cols[0],y);name.forEach((v,i)=>text(v,cols[1],y+i*13)); [numberDisplay(r.quantity),money(r.price),money(r.quantity*r.price)].forEach((v,i)=>text(v,cols[i+2],y,font,false,true));y+=name.length*13+6;}}else{for(let i=1;i<=12;i++){const m=key+'-'+String(i).padStart(2,'0'),t=calcTotals(recordsForMonth(m));ensure(22);text(monthLabel(m),cols[0],y);[numberDisplay(t.pastriesQty),money(t.pastriesMoney),numberDisplay(t.masasQty),money(t.masasMoney),money(t.totalMoney)].forEach((v,j)=>text(v,cols[j+1],y,font,false,true));y+=22;}}}
  if(!rows.length){ensure(15);text('No hay registros.',margin,y);y+=15;} summary(totals);pages.push(commands.join('\n'));
  const objects=[null,'<< /Type /Catalog /Pages 2 0 R >>','', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>']; const kids=[];
  for(const stream of pages){const id=objects.length;kids.push(id+' 0 R');objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${id+1} 0 R >>`);objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);}
  objects[2]=`<< /Type /Pages /Count ${kids.length} /Kids [${kids.join(' ')}] >>`;let pdf='%PDF-1.4\n', offsets=[0];for(let i=1;i<objects.length;i++){offsets.push(pdf.length);pdf+=`${i} 0 obj\n${objects[i]}\nendobj\n`;}const xref=pdf.length;pdf+=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;for(let i=1;i<objects.length;i++)pdf+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';pdf+=`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new File([pdf],`Palm-Springs-Bakery-${kind==='Week'?'Semana':monthly?'Mes':'Ano'}-${key}.pdf`,{type:'application/pdf'});
}
function downloadReport(file){const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download=file.name;a.target='_blank';a.rel='noopener';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),120000);}
async function shareReport(kind){try{const file=makeReportPDF(kind);if(navigator.canShare && navigator.canShare({files:[file]})){try{await navigator.share({files:[file]});return;}catch(e){if(e.name==='AbortError')return;}}downloadReport(file);}catch(e){console.error(e);alert('No se pudo generar el PDF. Inténtalo nuevamente.');}}
function printReport(kind){const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);if(ios){shareReport(kind);return;}window.print();}
