const state = { transactions: [] };
const $ = (id) => document.getElementById(id);
const money = (n) => new Intl.NumberFormat("en-IN", {style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);
const norm = (s) => String(s ?? "").trim().toLowerCase();

function categoryFor(description, isCredit) {
  if (isCredit) return "Income";
  const s = norm(description);
  if (/swiggy|zomato|restaurant|cafe|starbucks|food/.test(s)) return "Food & Drink";
  if (/dmart|grocery|bigbasket|blinkit|zepto|supermarket/.test(s)) return "Groceries";
  if (/uber|ola|rapido|metro|irctc|petrol|fuel/.test(s)) return "Transport";
  if (/amazon|flipkart|myntra|shopping/.test(s)) return "Shopping";
  if (/electricity|recharge|airtel|jio|bill|broadband/.test(s)) return "Bills";
  if (/atm|cash withdrawal/.test(s)) return "Cash";
  if (/upi|imps|neft|rtgs/.test(s)) return "Transfer / UPI";
  return "Other";
}
function parseAmount(value) {
  if (typeof value === "number") return value;
  const s = String(value ?? "").replace(/[₹,\s]/g,"").replace(/[()]/g,"");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}
function parseDate(value) {
  if (value instanceof Date && !isNaN(value)) return value;
  if (typeof value === "number" && value > 20000 && value < 80000) {
    return new Date(Date.UTC(1899,11,30) + value*86400000);
  }
  const s = String(value ?? "").trim();
  let m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (m) {
    let y = Number(m[3]); if (y < 100) y += 2000;
    return new Date(y, Number(m[2])-1, Number(m[1]));
  }
  const d = new Date(s);
  return isNaN(d) ? null : d;
}
function parseRows(rows) {
  if (!rows.length) return [];
  const headers = rows[0].map(norm);
  const find = (keys) => headers.findIndex(h => keys.some(k => h.includes(k)));
  const dateI = find(["date", "txn date", "transaction date", "value date"]);
  const descI = find(["narration", "description", "particulars", "details", "transaction remarks", "remarks"]);
  const debitI = find(["debit", "withdrawal", "withdrawals", "paid out"]);
  const creditI = find(["credit", "deposit", "deposits", "paid in"]);
  const amountI = find(["amount"]);
  if (dateI < 0 || descI < 0 || (debitI < 0 && creditI < 0 && amountI < 0)) {
    throw new Error("Could not identify the date, description and amount columns. Check that you selected the transaction table, not a statement summary.");
  }
  const out = [];
  for (const row of rows.slice(1)) {
    if (!row || !row.length) continue;
    const date = parseDate(row[dateI]);
    const desc = String(row[descI] ?? "").trim();
    if (!date || !desc) continue;
    let debit = debitI >= 0 ? parseAmount(row[debitI]) : 0;
    let credit = creditI >= 0 ? parseAmount(row[creditI]) : 0;
    // HDFC exports may contain blank cells or dashes; ignore rows with no transaction amount.
    let amount, direction;
    if (debit > 0) { amount = debit; direction = "debit"; }
    else if (credit > 0) { amount = credit; direction = "credit"; }
    else if (amountI >= 0) {
      const raw = parseAmount(row[amountI]);
      if (!raw) continue;
      amount = Math.abs(raw); direction = raw < 0 ? "debit" : "credit";
    } else continue;
    out.push({date, description:desc, amount, direction, category:categoryFor(desc, direction==="credit")});
  }
  return out;
}
function csvRows(text) {
  const rows=[]; let row=[], field="", quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i], next=text[i+1];
    if(c==='"' && quoted && next==='"'){field+='"';i++;}
    else if(c==='"') quoted=!quoted;
    else if(c===',' && !quoted){row.push(field.trim());field="";}
    else if((c==='\n'||c==='\r')&&!quoted){
      if(c==='\r'&&next==='\n')i++;
      row.push(field.trim()); if(row.some(v=>v!=="")) rows.push(row);
      row=[];field="";
    } else field+=c;
  }
  row.push(field.trim()); if(row.some(v=>v!=="")) rows.push(row);
  return rows;
}
async function importFile(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  let rows;
  if (ext === "csv") {
    rows = csvRows(await file.text());
  } else if (ext === "xlsx" || ext === "xls") {
    if (!window.XLSX) throw new Error("Excel parser is not installed. Add the official xlsx.full.min.js file beside index.html. No online parser will be used.");
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, {type:"array", cellDates:true});
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sheet, {header:1, raw:true, defval:""});
  } else {
    throw new Error("Please choose a CSV, XLS or XLSX file.");
  }
  const parsed = parseRows(rows);
  if (!parsed.length) throw new Error("No transactions were recognized. HDFC may have different column names or the file may contain a summary before the transaction table.");
  state.transactions = parsed.concat(state.transactions);
  render();
  $("status").textContent = `Read ${parsed.length} transactions from ${file.name} locally. No statement data was uploaded.`;
}
function render() {
  const debits = state.transactions.filter(t=>t.direction==="debit").reduce((a,t)=>a+t.amount,0);
  const credits = state.transactions.filter(t=>t.direction==="credit").reduce((a,t)=>a+t.amount,0);
  $("spent").textContent=money(debits); $("income").textContent=money(credits);
  $("count").textContent=String(state.transactions.length);
  $("empty").hidden=state.transactions.length>0;
  const host=$("transactions"); host.replaceChildren();
  [...state.transactions].sort((a,b)=>b.date-a.date).forEach(t=>{
    const item=document.createElement("div"); item.className="transaction";
    const icon=document.createElement("div"); icon.className="tx-icon"; icon.textContent=t.direction==="credit"?"↙":"↗";
    const main=document.createElement("div"); main.className="tx-main";
    const desc=document.createElement("div"); desc.className="tx-desc"; desc.textContent=t.description;
    const meta=document.createElement("div"); meta.className="tx-meta"; meta.textContent=`${t.category} · ${t.date.toLocaleDateString("en-IN")}`;
    main.append(desc,meta);
    const amount=document.createElement("div"); amount.className="tx-amount"+(t.direction==="credit"?" credit":"");
    amount.textContent=`${t.direction==="credit"?"+":"−"}${money(t.amount)}`;
    item.append(icon,main,amount); host.append(item);
  });
}
$("file").addEventListener("change", async e=>{
  const file=e.target.files?.[0]; if(!file)return;
  $("status").textContent="Reading locally…";
  try { await importFile(file); }
  catch(err) { $("status").textContent=err.message; }
  e.target.value="";
});
$("sample").addEventListener("click",()=>{
  state.transactions=[
    {date:new Date("2026-10-12"),description:"UPI/DMART",amount:1840,direction:"debit",category:"Groceries"},
    {date:new Date("2026-10-11"),description:"UPI/STARBUCKS",amount:320,direction:"debit",category:"Food & Drink"},
    {date:new Date("2026-10-10"),description:"SALARY CREDIT",amount:83000,direction:"credit",category:"Income"},
    {date:new Date("2026-10-09"),description:"UPI/UBER",amount:265,direction:"debit",category:"Transport"},
    {date:new Date("2026-10-08"),description:"UPI/AMAZON",amount:1299,direction:"debit",category:"Shopping"}
  ];
  $("status").textContent="Sample transactions loaded. These are fictional examples.";
  render();
});
$("clear").addEventListener("click",()=>{
  state.transactions=[]; render(); $("status").textContent="Transactions cleared from page memory.";
});
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
}
render();
