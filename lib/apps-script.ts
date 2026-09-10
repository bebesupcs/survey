export function appsScript(secret: string) {
  return `// 베베숲 설문 전용 Google Apps Script
const SPREADSHEET_ID = '1chXyMf9FfRXaO4LZIzB2Vj4K89MuwzSvilsOHOMX82s';
const SECRET = ${JSON.stringify(secret)};
const RESPONSE_SHEET = '베베숲_응답';
const DICTIONARY_SHEET = '베베숲_문항사전';
const SUMMARY_SHEET = '베베숲_분석_종합';
const DETAIL_SHEET = '베베숲_응답_상세';
function json(value){return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);}
function safe(value){if(value===null||value===undefined)return '';if(typeof value==='number')return value;const s=String(value);return /^0[0-9]+$/.test(s)||/^[=+@\\-\\t\\r\\n]/.test(s)?"'"+s:s;}
function getOrCreate(book,name){return book.getSheetByName(name)||book.insertSheet(name);}
function doPost(e){let lock;try{
  const data=JSON.parse(e.postData.contents);if(data.secret!==SECRET)return json({ok:false});
  const book=SpreadsheetApp.openById(SPREADSHEET_ID);
  if(data.action==='ping')return json({ok:true,spreadsheetId:book.getId()});
  if(data.action==='refreshAnalysis'&&Array.isArray(data.questions)){refreshAnalysis(book,data.questions);return json({ok:true});}
  if(data.action!=='submit'||!data.id||!Array.isArray(data.questions))return json({ok:false});
  lock=LockService.getScriptLock();lock.waitLock(20000);
  const sheet=getOrCreate(book,RESPONSE_SHEET);
  if(sheet.getLastRow()>1&&sheet.getRange(2,1,sheet.getLastRow()-1,1).createTextFinder(data.id).matchEntireCell(true).findNext())return json({ok:true,id:data.id});
  const values={'응답ID':data.id,'제출일시':data.submittedAt,'설문버전':data.version,'고객유형':data.answers.Q13||data.answers.Q12||''};
  for(const q of data.questions){const v=data.answers[q.id];values[q.id]=Array.isArray(v)?JSON.stringify(v):(q.type==='score'&&v!==undefined?Number(v):v??'');values[q.id+'_기타']=data.answers[q.id+'_other']||'';if(q.type==='multi')for(const option of q.options)values[q.id+' | '+option]=v===undefined?'':(v.includes(option)?1:0);}
  let headers=sheet.getLastRow()?sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0]:[];
  for(const key of Object.keys(values))if(!headers.includes(key))headers.push(key);
  if(sheet.getMaxColumns()<headers.length)sheet.insertColumnsAfter(sheet.getMaxColumns(),headers.length-sheet.getMaxColumns());
  sheet.getRange(1,1,1,headers.length).setValues([headers.map(safe)]);sheet.setFrozenRows(1);
  const dictionary=getOrCreate(book,DICTIONARY_SHEET);
  if(!dictionary.getLastRow())dictionary.appendRow(['설문버전','문항번호','질문','유형','선택지']);
  const known=dictionary.getLastRow()>1?dictionary.getRange(2,1,dictionary.getLastRow()-1,1).createTextFinder(String(data.version)).matchEntireCell(true).findNext():null;
  if(!known){const rows=data.questions.map(q=>[data.version,q.id,q.title,q.type,JSON.stringify(q.options)].map(safe));dictionary.getRange(dictionary.getLastRow()+1,1,rows.length,5).setValues(rows);}
  sheet.getRange(sheet.getLastRow()+1,1,1,headers.length).setValues([headers.map(h=>safe(values[h]??''))]);SpreadsheetApp.flush();
  refreshAnalysis(book,data.questions);
  return json({ok:true,id:data.id});
}catch(err){return json({ok:false});}finally{if(lock&&lock.hasLock())lock.releaseLock();}}
function refreshAnalysis(book,questions){
  const source=book.getSheetByName(RESPONSE_SHEET),summary=getOrCreate(book,SUMMARY_SHEET),detail=getOrCreate(book,DETAIL_SHEET);
  summary.clearContents();detail.clearContents();
  if(!source||source.getLastRow()<2){summary.getRange(1,1,2,2).setValues([['지표','값'],['총 응답 수',0]]);return;}
  const data=source.getDataRange().getValues(),headers=data[0].map(String),rows=data.slice(1),find=name=>headers.indexOf(name),count=rows.length;
  const scores=find('Q24')>=0?rows.map(r=>Number(r[find('Q24')])).filter(n=>Number.isFinite(n)&&n>=0&&n<=10):[];
  const promoters=scores.filter(n=>n>=9).length,detractors=scores.filter(n=>n<=6).length,nps=scores.length?Math.round((promoters-detractors)/scores.length*100):'';
  const top=[['지표','값'],['총 응답 수',count],['NPS',nps],['평균 추천 점수',scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length*10)/10:''],['경품 응모',countValue(rows,find('Q28'),'네, 참여할게요')],['인터뷰 관심',countValue(rows,find('Q31'),'네, 참여하고 싶어요')],[],['문항번호','질문','선택지/지표','응답수','비율']];
  const stats=[];
  for(const q of questions){if(q.type==='text'||q.type==='phone')continue;for(const option of q.options){let n=0;if(q.type==='multi'){const col=find(q.id+' | '+option);if(col>=0)n=rows.filter(r=>Number(r[col])===1).length;}else{const col=find(q.id);if(col>=0)n=rows.filter(r=>String(r[col])===String(option)).length;}stats.push([q.id,q.title,option,n,count?Math.round(n/count*1000)/10:0]);}}
  const summaryRows=top.concat(stats);summary.getRange(1,1,summaryRows.length,5).setValues(summaryRows.map(r=>{const row=r.slice();while(row.length<5)row.push('');return row;}));summary.setFrozenRows(1);summary.autoResizeColumns(1,5);if(stats.length)summary.getRange(9,5,stats.length,1).setNumberFormat('0.0"%"');
  const excluded=new Set(['Q29','Q34','Q35']);const detailQuestions=questions.filter(q=>!excluded.has(q.id));const detailHeaders=['응답ID','제출일시','설문버전','고객유형'].concat(detailQuestions.map(q=>q.id+' '+q.title));
  const detailRows=rows.map(row=>{const base=['응답ID','제출일시','설문버전','고객유형'].map(h=>row[find(h)]??'');return base.concat(detailQuestions.map(q=>{const col=find(q.id);return col>=0?row[col]:'';}));});
  detail.getRange(1,1,1,detailHeaders.length).setValues([detailHeaders]);if(detailRows.length)detail.getRange(2,1,detailRows.length,detailHeaders.length).setValues(detailRows);detail.setFrozenRows(1);detail.getRange(1,1,1,detailHeaders.length).setWrap(true);
}
function countValue(rows,col,value){return col<0?0:rows.filter(r=>String(r[col])===value).length;}
// 경품 지급과 인터뷰 혜택 제공이 모두 끝난 뒤 실행하면 90일 후 연락처와 이름을 삭제합니다.
function scheduleContactDeletion(){const end=new Date();end.setDate(end.getDate()+90);ScriptApp.newTrigger('deleteInterviewContacts').timeBased().at(end).create();}
function deleteInterviewContacts(){const sheet=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(RESPONSE_SHEET);if(!sheet||sheet.getLastRow()<2)return;const headers=sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];for(const key of ['Q29','Q34','Q35']){const col=headers.indexOf(key);if(col>=0)sheet.getRange(2,col+1,sheet.getLastRow()-1,1).clearContent();}}
`;
}
