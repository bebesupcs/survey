export function appsScript(secret: string) {
  return `// 베베숲 설문 전용 Google Apps Script
const SPREADSHEET_ID = '1chXyMf9FfRXaO4LZIzB2Vj4K89MuwzSvilsOHOMX82s';
const SECRET = ${JSON.stringify(secret)};
const RESPONSE_SHEET = '베베숲_응답';
const DICTIONARY_SHEET = '베베숲_문항사전';
function json(value){return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);}
function safe(value){if(value===null||value===undefined)return '';if(typeof value==='number')return value;const s=String(value);return /^0[0-9]+$/.test(s)||/^[=+@\\-\\t\\r\\n]/.test(s)?"'"+s:s;}
function doPost(e){let lock;try{
const data=JSON.parse(e.postData.contents);if(data.secret!==SECRET)return json({ok:false});
const book=SpreadsheetApp.openById(SPREADSHEET_ID);
if(data.action==='ping')return json({ok:true,spreadsheetId:book.getId()});
if(data.action!=='submit'||!data.id||!Array.isArray(data.questions))return json({ok:false});
lock=LockService.getScriptLock();lock.waitLock(20000);
let sheet=book.getSheetByName(RESPONSE_SHEET);if(!sheet)sheet=book.insertSheet(RESPONSE_SHEET);
if(sheet.getLastRow()>1&&sheet.getRange(2,1,sheet.getLastRow()-1,1).createTextFinder(data.id).matchEntireCell(true).findNext())return json({ok:true,id:data.id});
const values={'응답ID':data.id,'제출일시':data.submittedAt,'설문버전':data.version,'고객유형':data.answers.Q12||''};
for(const q of data.questions){const v=data.answers[q.id];values[q.id]=Array.isArray(v)?JSON.stringify(v):(q.type==='score'&&v!==undefined?Number(v):v??'');values[q.id+'_기타']=data.answers[q.id+'_other']||'';if(q.type==='multi')for(const option of q.options){values[q.id+' | '+option]=v===undefined?'':(v.includes(option)?1:0);}}
let headers=sheet.getLastRow()?sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0]:[];
for(const key of Object.keys(values))if(!headers.includes(key))headers.push(key);
if(sheet.getMaxColumns()<headers.length)sheet.insertColumnsAfter(sheet.getMaxColumns(),headers.length-sheet.getMaxColumns());
sheet.getRange(1,1,1,headers.length).setValues([headers.map(safe)]);sheet.setFrozenRows(1);
let dictionary=book.getSheetByName(DICTIONARY_SHEET);if(!dictionary)dictionary=book.insertSheet(DICTIONARY_SHEET);
if(!dictionary.getLastRow())dictionary.appendRow(['설문버전','문항번호','질문','유형','선택지']);
const known=dictionary.getLastRow()>1?dictionary.getRange(2,1,dictionary.getLastRow()-1,1).createTextFinder(String(data.version)).matchEntireCell(true).findNext():null;
if(!known){const rows=data.questions.map(q=>[data.version,q.id,q.title,q.type,JSON.stringify(q.options)].map(safe));dictionary.getRange(dictionary.getLastRow()+1,1,rows.length,5).setValues(rows);}
const row=headers.map(h=>safe(values[h]??''));sheet.getRange(sheet.getLastRow()+1,1,1,row.length).setValues([row]);SpreadsheetApp.flush();
return json({ok:true,id:data.id});
}catch(err){return json({ok:false});}finally{if(lock&&lock.hasLock())lock.releaseLock();}}
// 인터뷰와 혜택 제공이 종료되면 아래 함수를 실행해 연락처 보유 종료를 예약하세요.
// 90일 이내 파기 안내에 맞춰 종료일부터 90일 뒤 연락처와 이름을 삭제합니다.
function scheduleContactDeletion(){const end=new Date();end.setDate(end.getDate()+90);ScriptApp.newTrigger('deleteInterviewContacts').timeBased().at(end).create();}
function deleteInterviewContacts(){const sheet=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(RESPONSE_SHEET);if(!sheet||sheet.getLastRow()<2)return;const headers=sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];for(const key of ['Q29','Q30']){const col=headers.indexOf(key);if(col>=0)sheet.getRange(2,col+1,sheet.getLastRow()-1,1).clearContent();}}
`;
}
