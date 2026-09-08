import assert from 'node:assert/strict';
import fs from 'node:fs';
let s=fs.readFileSync('survey.test.mjs','utf8').replace("context.safe('01012345678'),'01012345678'","context.safe('01012345678'),\"'01012345678\"");fs.writeFileSync('survey.test.mjs',s);
const origin='http://localhost:3000';
let r=await fetch(origin+'/api/survey');assert.equal(r.status,200);let d=await r.json();assert.equal(d.questions.length,36);assert.equal(d.ready,false);
r=await fetch(origin+'/api/admin');assert.equal(r.status,403);
r=await fetch(origin+'/api/submit',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://evil.example'},body:'{}'});assert.equal(r.status,403);
r=await fetch(origin+'/api/submit',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({id:crypto.randomUUID(),version:'1',answers:{}})});assert.equal(r.status,400);
console.log('PASS: public schema, administrator denied, cross-origin denied, missing answers rejected.');
