import { parseCsv, toGeoJSON } from "./csv.js";
import { loadCsv, networkHits } from "./data.js";
import { addLayers, fitToData, map } from "./map.js";

const statusEl = document.getElementById("status");

async function init({ force = false } = {}) {
  statusEl.textContent = "Loading food banks…";
  try {
    const { text, source } = await loadCsv({ force });
    const geojson = toGeoJSON(parseCsv(text));
    addLayers(geojson);
    fitToData(geojson);
    statusEl.innerHTML =
      `${geojson.features.length} food banks · loaded from <b>${source}</b> ` +
      `(mock network calls this session: ${networkHits})<br>` +
      `<button id="reload">Force re-download</button>`;
    document.getElementById("reload").onclick = () => init({ force: true });
  } catch (err) {
    statusEl.textContent = "Could not load data: " + err.message;
  }
}

map.on("load", () => init());
