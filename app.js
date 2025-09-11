// 1) BURAYA yayınladığın CSV linkini yapıştır:
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1RtHLgzmaAsjNfQM79b5jy4kkaRbPFdMznbO3kktr3Ng/edit?usp=sharing"; // <-- değiştir

// 2) Basit ayarlar
const PAGE_SIZE = 12;
const PLACEHOLDER_IMG = "https://via.placeholder.com/800x500?text=SGT+Urun";

let products = [];
let filtered = [];
let page = 1;

const $ = (sel) => document.querySelector(sel);
const grid = $("#grid");
const q = $("#q");
const cat = $("#cat");
const sort = $("#sort");
const pager = $("#pager");

function priceFmt(n) {
  if (n === "" || n == null || isNaN(+n)) return "";
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(+n);
}

function normalizeRow(r){
  // Beklenen başlıklar: id,kategori,marka,model,ozet,fiyat,stok,resim_url,urun_url,guncelleme
  return {
    id: r.id || r.ID || "",
    kategori: r.kategori || r.Kategori || "",
    marka: r.marka || r.Marka || "",
    model: r.model || r.Model || "",
    ozet: r.ozet || r.Ozet || r["özellik"] || r["ozellik"] || "",
    fiyat: r.fiyat || r.Fiyat || "",
    stok: r.stok || r.Stok || "",
    resim_url: r.resim_url || r.resim || r["resim url"] || "",
    urun_url: r.urun_url || r.link || r.URL || "",
    guncelleme: r.guncelleme || r.Guncelleme || r.Güncelleme || ""
  };
}

function render(){
  // filtre uygula
  const term = (q.value || "").toLowerCase().trim();
  filtered = products.filter(p=>{
    const catOk = !cat.value || p.kategori === cat.value;
    const txt = `${p.marka} ${p.model} ${p.ozet} ${p.kategori}`.toLowerCase();
    const qOk = !term || txt.includes(term);
    return catOk && qOk;
  });

  // sırala
  if (sort.value === "price-asc") filtered.sort((a,b)=>(+a.fiyat||1e15)-(+b.fiyat||1e15));
  else if (sort.value === "price-desc") filtered.sort((a,b)=>(+b.fiyat||-1e15)-(+a.fiyat||-1e15));
  else if (sort.value === "stock") filtered.sort((a,b)=>String(b.stok).localeCompare(String(a.stok)));

  // sayfalama
  const total = filtered.length;
  const start = (page-1)*PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const view = filtered.slice(start,end);

  // grid
  grid.innerHTML = "";
  const tpl = document.getElementById("product-card");
  view.forEach(p=>{
    const node = tpl.content.cloneNode(true);
    const aimg = node.querySelector(".imgwrap");
    const img = node.querySelector("img");
    const title = `${p.marka} ${p.model}`.trim() || p.model || p.marka || "Ürün";
    aimg.href = p.urun_url || "#";
    img.alt = title;
    img.src = p.resim_url || PLACEHOLDER_IMG;
    node.querySelector(".p-cat").textContent = p.kategori || "";
    node.querySelector(".p-stock").textContent = p.stok || "";
    node.querySelector(".p-title").textContent = title;
    node.querySelector(".p-desc").textContent = p.ozet || "";
    node.querySelector(".p-price").textContent = priceFmt(p.fiyat);
    const link = node.querySelector(".p-link");
    link.href = p.urun_url || "#";
    grid.appendChild(node);
  });

  // pager
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  pager.innerHTML = "";
  const mkBtn = (t,dis,handler)=>{
    const b = document.createElement("button");
    b.textContent = t;
    if(dis) b.disabled = true;
    b.addEventListener("click", handler);
    return b;
  };
  pager.appendChild(mkBtn("⟨", page===1, ()=>{ page=1; render(); }));
  pager.appendChild(mkBtn("‹", page===1, ()=>{ page=Math.max(1,page-1); render(); }));
  pager.appendChild(document.createTextNode(` Sayfa ${page}/${pages} `));
  pager.appendChild(mkBtn("›", page===pages, ()=>{ page=Math.min(pages,page+1); render(); }));
  pager.appendChild(mkBtn("⟩", page===pages, ()=>{ page=pages; render(); }));
}

function attachEvents(){
  q.addEventListener("input", ()=>{ page=1; render(); });
  cat.addEventListener("change", ()=>{ page=1; render(); });
  sort.addEventListener("change", ()=>{ page=1; render(); });
}

async function load(){
  try{
    const resp = await fetch(SHEET_CSV_URL, { cache:"no-store" });
    const text = await resp.text();
    const parsed = Papa.parse(text, { header:true, skipEmptyLines:true });
    products = parsed.data.map(normalizeRow);
    render();
  }catch(err){
    grid.innerHTML = `<div class="card">Ürün listesi yüklenemedi. CSV bağlantısını kontrol edin.</div>`;
    console.error(err);
  }
}

attachEvents();
load();
