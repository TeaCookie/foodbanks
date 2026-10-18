const DATA_URL = "/data/food_banks.csv";
const DATA_VERSION = "2025-03-06";
const CACHE_NAME = "food-banks-static";

const MOCK_CSV = `sequence_id,facility_name,physical_address,mailing_address,locality,postal_code,phone,website,latitude,longitude,date_updated
108,New Life Assembly Family Assistance Program Food Bank,"Tumbler Ridge, BC",275 Murray Drive,Tumbler Ridge,V0C 2W0,250-242-7404,,55.13419,-120.991844,2025-03-06
190,St. Joseph's Food Bank,"Mission, BC",32550 7th Ave,Mission,V2V 2B9,604-425-0392,http://missionfoodbank.com/about/,49.1399518,-122.3233595,2025-03-06
195,Vanderhoof Neighbourlink Food Bank,"121 Stewart Street West, Vanderhoof, BC",PO Box 2353,Vanderhoof,V0J 3A0,250-567-9007,,54.0160977,-124.0097386,2025-03-06`;

export let networkHits = 0;

async function mockNetworkFetch(url) {
  networkHits++;
  await new Promise(r => setTimeout(r, 600));
  return new Response(MOCK_CSV, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}

export async function loadCsv({ force = false } = {}) {
  const key = `${DATA_URL}?v=${DATA_VERSION}`;
  if (!("caches" in window)) {
    return { text: await (await mockNetworkFetch(key)).text(), source: "network (no Cache API)" };
  }
  const cache = await caches.open(CACHE_NAME);
  if (!force) {
    const hit = await cache.match(key);
    if (hit) return { text: await hit.text(), source: "cache" };
  }
  const res = await mockNetworkFetch(key);
  if (!res.ok) throw new Error("HTTP " + res.status);
  await cache.put(key, res.clone());
  for (const req of await cache.keys()) {
    if (req.url !== new URL(key, location.href).href) await cache.delete(req);
  }
  return { text: await res.text(), source: "network" };
}
