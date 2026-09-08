import assert from 'node:assert/strict';
import {questions,visible,cleanAnswers,validate} from './lib/survey.ts';
import {appsScript} from './lib/apps-script.ts';
import vm from 'node:vm';
const q=id=>questions.find(q=>q.id===id);
for(let s=0;s<6;s++){
 const a={Q12:q('Q12').options[s]};
 assert.equal(visible(q('Q13'),a),s<4);assert.equal(visible(q('Q17'),a),s<4);
 assert.equal(visible(q('Q18-A'),a),s<3);assert.equal(visible(q('Q18-B'),a),s===3);assert.equal(visible(q('Q18-C'),a),s===4);assert.equal(visible(q('Q24'),a),s<5);
 const filled={};for(const item of questions){if(!visible(item,{...filled,Q12:a.Q12}))continue;if(item.id==='Q12'){filled.Q12=a.Q12;continue;}if(item.id==='Q26'){filled.Q26=q('Q26').options[2];continue;}if(item.required)filled[item.id]=item.type==='multi'?[item.options[0]]:item.type==='text'?'테스트 응답':item.options[0];}
 assert.equal(validate(questions,cleanAnswers(questions,filled)),'');
}
let a={Q26:q('Q26').options[0],Q31:'동의합니다',Q29:'이름',Q30:'01012345678'};
assert.equal(visible(q('Q29'),a),true);a.Q31='동의하지 않습니다';let clean=cleanAnswers(questions,a);assert.equal(clean.Q29,undefined);assert.equal(clean.Q30,undefined);assert.equal(validate(questions.filter(q=>q.section===8),clean),'');
a.Q26=q('Q26').options[2];clean=cleanAnswers(questions,a);assert.equal(clean.Q31,undefined);
assert.equal(visible(q('Q6'),{Q4:'기타 브랜드',Q4_other:'A',Q5:'기타 브랜드',Q5_other:'B'}),true);
assert.equal(visible(q('Q6'),{Q4:'기타 브랜드',Q4_other:'A',Q5:'기타 브랜드',Q5_other:'A'}),false);
assert.equal(visible(q('Q8'),{Q7:'한 브랜드만 사용하고 있다'}),false);
assert.notEqual(validate([q('Q2')],{Q2:q('Q2').options.slice(0,3)}),'');
assert.notEqual(validate([q('Q23')],{Q12:q('Q12').options[0],Q22:'0',Q23:'   '}),'');
assert.equal(visible(q('Q23'),{Q12:q('Q12').options[0],Q22:'0'}),true);
assert.notEqual(validate([q('Q30')],{Q26:q('Q26').options[0],Q31:'동의합니다',Q30:'123'}),'');
assert.equal(cleanAnswers(questions,{Q12:q('Q12').options[5],Q18_A:['unused'],Q22:'8',Q23:'old'}).Q22,undefined);
const code=appsScript('test-secret');new vm.Script(code);
let context={ContentService:{MimeType:{JSON:'json'},createTextOutput:s=>({setMimeType:()=>JSON.parse(s)})}};vm.createContext(context);vm.runInContext(code,context);assert.equal(context.safe('=IMPORTXML("x")').startsWith("'"),true);assert.equal(context.safe('01012345678'),"'01012345678");assert.equal(context.doPost({postData:{contents:JSON.stringify({secret:'bad'})}}).ok,false);
console.log('PASS: 6 customer paths, conditional questions, consent cleanup, max selection, phone validation, NPS zero, script syntax, formula protection and bridge authorization.');
class Range {constructor(sheet,r,c,rows=1,cols=1){Object.assign(this,{sheet,r,c,rows,cols});}getValues(){return Array.from({length:this.rows},(_,i)=>Array.from({length:this.cols},(_,j)=>this.sheet.rows[this.r-1+i]?.[this.c-1+j]??''));}setValues(values){for(let i=0;i<values.length;i++){this.sheet.rows[this.r-1+i]??=[];for(let j=0;j<values[i].length;j++)this.sheet.rows[this.r-1+i][this.c-1+j]=values[i][j];}return this;}createTextFinder(text){return {matchEntireCell:()=>({findNext:()=>this.getValues().flat().some(v=>String(v)===String(text))?{}:null})};}clearContent(){return this.setValues(Array.from({length:this.rows},()=>Array(this.cols).fill('')));}}
class Sheet {rows=[];columns=26;getLastRow(){return this.rows.length;}getLastColumn(){return Math.max(0,...this.rows.map(r=>r.length));}getRange(...args){return new Range(this,...args);}getMaxColumns(){return this.columns;}insertColumnsAfter(_,n){this.columns+=n;}setFrozenRows(){}appendRow(row){this.rows.push(row);}}
const sheets=new Map();let lockHeld=false;
context.SpreadsheetApp={openById:()=>({getId:()=> '1chXyMf9FfRXaO4LZIzB2Vj4K89MuwzSvilsOHOMX82s',getSheetByName:n=>sheets.get(n),insertSheet:n=>{const s=new Sheet();sheets.set(n,s);return s;}}),flush(){}};
context.LockService={getScriptLock:()=>({waitLock:()=>{lockHeld=true},hasLock:()=>lockHeld,releaseLock:()=>{lockHeld=false}})};
const submit={secret:'test-secret',action:'submit',id:'submission-one',version:'1',submittedAt:new Date().toISOString(),answers:{Q1:[questions[0].options[0]],Q12:questions.find(q=>q.id==='Q12').options[0],Q22:'0',Q29:'=SUM(A1:A3)',Q30:'01012345678'},questions};
const call=d=>context.doPost({postData:{contents:JSON.stringify(d)}});
assert.equal(call(submit).ok,true);assert.equal(call(submit).ok,true);assert.equal(lockHeld,false);
const sheet=sheets.get('베베숲_응답');assert.equal(sheet.rows.length,2);const header=sheet.rows[0],row=sheet.rows[1];assert.equal(row[header.indexOf('Q22')],0);assert.equal(row[header.indexOf('Q30')],"'01012345678");assert.equal(row[header.indexOf('Q1 | '+questions[0].options[0])],1);assert.equal(row[header.indexOf('Q1 | '+questions[0].options[1])],0);assert.equal(row[header.indexOf('Q29')],"'=SUM(A1:A3)");
context.deleteInterviewContacts();assert.equal(sheet.rows[1][header.indexOf('Q29')],'');assert.equal(sheet.rows[1][header.indexOf('Q30')],'');assert.equal(sheet.rows[1][header.indexOf('Q22')],0);
console.log('PASS: bridge writes, duplicate retry, checkbox statistics, NPS numeric zero, phone leading zero and scheduled contact deletion.');
import {isValidPhoneNumber,formatPhoneNumber} from './lib/survey.ts';
for(const value of ['01012345678','010-1234-5678','010 1234 5678']){assert.equal(isValidPhoneNumber(value),true);assert.equal(formatPhoneNumber(value),'010-1234-5678');}
for(const value of ['0101234567','010123456789','0212345678','010abcd5678','+821012345678']){assert.equal(isValidPhoneNumber(value),false);assert.equal(formatPhoneNumber(value),value);}
assert.equal(formatPhoneNumber('0111234567'),'011-123-4567');
assert.equal(formatPhoneNumber(''),'');assert.equal(formatPhoneNumber('010123'),'010123');
console.log('PASS: phone normalization, hyphenated input, spaces, invalid length/prefix/letters and partial input.');
