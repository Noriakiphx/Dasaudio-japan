// DAS Audio 特設サイト — Base44 連携（サーバ側プロキシ）
// サイトからは /.netlify/functions/products を叩くだけ。Base44のAPIキーはここ（サーバ側）でのみ使用。
//
// 必要な環境変数（Netlify → Project configuration → Environment variables）:
//   BASE44_API_KEY = Base44 アカウントの API Key（Base44: アカウント設定 → API Key）
//
// ※ Base44 REST のエンドポイント／認証ヘッダは下記定数。初回テストで合わなければここだけ調整。

const APP_ID   = "6a1a7698255d8d4e774e3c75";            // AudioStock Pro
const BRAND_ID = "6a1a7bf09b38ad50902173f0";            // DAS Audio
const BASE     = `https://app.base44.com/api/apps/${APP_ID}/entities`;

// カテゴリの並び順 → サイトのフィルタキー＆見出しタグ（タブと一致させる）
const CATMAP = {
  1: ["touring", "ARA SERIES ／ Self-Powered Cardioid Line Array"],
  2: ["curved",  "VANTEC SERIES ／ Active Curved Source"],
  3: ["array",   "EVENT SERIES ／ Powered Line Array"],
  4: ["install", "INSTALL SERIES ／ Fixed Installation"],
  5: ["dsp",     "PROCESSORS & AMPLIFIERS"],
  6: ["soft",    "SOFTWARE & CONTROL"],
};

function arr(x){ return Array.isArray(x) ? x : (x && Array.isArray(x.entities) ? x.entities : []); }

function parseSpecs(specs){
  // "key｜value" を改行区切り。先頭の「タイプ｜…」は sub として取り出す
  const lines = String(specs || "").split("\n").map(l=>l.trim()).filter(Boolean);
  let sub = "";
  const rows = [];
  for(const line of lines){
    const i = line.indexOf("｜");
    const k = i>=0 ? line.slice(0,i).trim() : "";
    const v = i>=0 ? line.slice(i+1).trim() : line;
    if(k === "タイプ" && !sub){ sub = v; continue; }
    rows.push([k, v]);
  }
  return { sub, rows };
}

exports.handler = async function(){
  const key = process.env.BASE44_API_KEY;
  if(!key){
    return json(200, { series: [], note: "BASE44_API_KEY not set" }); // サイト側は内蔵データにフォールバック
  }
  const headers = { "api_key": key, "Authorization": "Bearer " + key, "Content-Type": "application/json" };
  try{
    const [catRes, prodRes] = await Promise.all([
      fetch(`${BASE}/Category`, { headers }),
      fetch(`${BASE}/Product`,  { headers }),
    ]);
    if(!catRes.ok || !prodRes.ok){
      return json(200, { series: [], error: `base44 ${catRes.status}/${prodRes.status}` });
    }
    const cats  = arr(await catRes.json()).filter(c => c.brand_id === BRAND_ID);
    const prods = arr(await prodRes.json()).filter(p => p.brand_id === BRAND_ID && p.is_published !== false);

    cats.sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
    const series = cats.map(c=>{
      const map = CATMAP[c.sort_order] || ["all", c.name];
      const items = prods
        .filter(p => p.category_id === c.id)
        .sort((a,b)=>(a.sort_order||0)-(b.sort_order||0))
        .map(p=>{
          const { sub, rows } = parseSpecs(p.specs);
          return {
            id: p.id,
            name: p.name,
            type: sub,
            sub: sub,
            desc: p.description || "",
            specs: rows,
            photo: p.image_url || ""
          };
        });
      return { id: c.id, cat: map[0], tag: map[1], title: c.name, desc: c.description || "", items };
    }).filter(s => s.items.length);

    return json(200, { series });
  }catch(e){
    return json(200, { series: [], error: String(e) });
  }
};

function json(statusCode, body){
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=60"   // 60秒キャッシュ（ほぼリアルタイム）
    },
    body: JSON.stringify(body)
  };
}
