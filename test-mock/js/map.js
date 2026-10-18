const maplibregl = window.maplibregl;

export const map = new maplibregl.Map({
  container: "map",
  center: [-125.8, 54.5],
  zoom: 4.3,
  style: "https://demotiles.maplibre.org/style.json"
});
map.addControl(new maplibregl.NavigationControl(), "top-right");

const esc = s => String(s ?? "").replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function renderPopup(p) {
  const site = /^https?:\/\//i.test(p.website)
    ? `<p><a href="${esc(p.website)}" target="_blank" rel="noopener">Website</a></p>` : "";
  return `<div class="popup">
    <h3>${esc(p.facility_name)}</h3>
    <p>${esc(p.physical_address)}</p>
    ${p.mailing_address ? `<p>Mail: ${esc(p.mailing_address)} ${esc(p.postal_code)}</p>` : ""}
    ${p.phone ? `<p>${esc(p.phone)}</p>` : ""}
    ${site}
    <p style="color:#777">Updated ${esc(p.date_updated)}</p>
  </div>`;
}

export function addLayers(geojson) {
  if (map.getSource("food-banks")) {
    map.getSource("food-banks").setData(geojson);
    return;
  }
  map.addSource("food-banks", {
    type: "geojson", data: geojson,
    cluster: true, clusterRadius: 45, clusterMaxZoom: 11
  });
  map.addLayer({
    id: "clusters", type: "circle", source: "food-banks",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": "#d97706",
      "circle-radius": ["step", ["get", "point_count"], 14, 10, 18, 50, 24],
      "circle-stroke-width": 2, "circle-stroke-color": "#fff"
    }
  });
  map.addLayer({
    id: "cluster-count", type: "symbol", source: "food-banks",
    filter: ["has", "point_count"],
    layout: { "text-field": "{point_count_abbreviated}", "text-size": 12 },
    paint: { "text-color": "#fff" }
  });
  map.addLayer({
    id: "points", type: "circle", source: "food-banks",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": "#16a34a", "circle-radius": 8,
      "circle-stroke-width": 2, "circle-stroke-color": "#fff"
    }
  });

  map.on("click", "clusters", async e => {
    const f = map.queryRenderedFeatures(e.point, { layers: ["clusters"] })[0];
    const zoom = await map.getSource("food-banks").getClusterExpansionZoom(f.properties.cluster_id);
    map.easeTo({ center: f.geometry.coordinates, zoom });
  });
  map.on("click", "points", e => {
    const f = e.features[0];
    new maplibregl.Popup({ offset: 10 })
      .setLngLat(f.geometry.coordinates.slice())
      .setHTML(renderPopup(f.properties))
      .addTo(map);
  });
  for (const id of ["clusters", "points"]) {
    map.on("mouseenter", id, () => map.getCanvas().style.cursor = "pointer");
    map.on("mouseleave", id, () => map.getCanvas().style.cursor = "");
  }
}

export function fitToData(geojson) {
  if (!geojson.features.length) return;
  const bounds = new maplibregl.LngLatBounds();
  geojson.features.forEach(f => bounds.extend(f.geometry.coordinates));
  map.fitBounds(bounds, { padding: 60, maxZoom: 9, duration: 800 });
}
