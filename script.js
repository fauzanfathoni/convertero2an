// --- DOM Elements
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const uploadText = document.getElementById('upload-text');
const convertBtn = document.querySelector('.convert-btn');
const previewContainer = document.getElementById('preview-table');

let selectedFile = null;
let parsedData = null;

// --- Upload Handling
uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});
uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('dragover');
});
uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', () => handleFile(fileInput.files[0]));

function handleFile(file) {
  if (!file) return;
  if (!file.name.endsWith('.kml') && !file.name.endsWith('.kmz')) {
    return alert("Please upload a .kml or .kmz file.");
  }

  selectedFile = file;
  uploadText.innerHTML = `<strong>Convert :</strong> ${file.name}`;

  if (file.name.endsWith('.kmz')) {
    JSZip.loadAsync(file).then(async zip => {
      const kmlFiles = Object.values(zip.files).filter(f => f.name.endsWith('.kml'));
      if (kmlFiles.length === 0) return alert("No KML file found inside KMZ.");

      let allKmlTexts = [];
      for (const kmlFile of kmlFiles) {
        try {
          const kmlText = await kmlFile.async("text");
          const parser = new DOMParser();
          const xml = parser.parseFromString(kmlText, "text/xml");
          const placemarks = xml.getElementsByTagNameNS("*", "Placemark");
          if (placemarks.length > 0) allKmlTexts.push(kmlText);
        } catch (e) {
          console.warn(`Failed to read ${kmlFile.name}`, e);
        }
      }

      if (allKmlTexts.length === 0) {
        alert("No Placemark data found in any KML file inside this KMZ.");
        return;
      }

      const combined = `<kml><Document>${allKmlTexts.map(k => {
        const xml = new DOMParser().parseFromString(k, "text/xml");
        const placemarks = xml.getElementsByTagNameNS("*", "Placemark");
        return Array.from(placemarks).map(p => p.outerHTML).join("");
      }).join("")}</Document></kml>`;

      parseKML(combined);
    });
  } else {
    file.text().then(kmlText => parseKML(kmlText));
  }
}

function parseKML(kmlText) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(kmlText, "text/xml");
  const placemarks = xml.getElementsByTagNameNS("*", "Placemark");
  if (placemarks.length === 0) return alert("No Placemark found in this KML.");

  let rows = [];
  let headersSet = new Set();
  let fatToPoleMap = new Map();

  // Mapping POLE_FAT
  for (let placemark of placemarks) {
    const simpleDataElems = placemark.getElementsByTagNameNS("*", "SimpleData");
    let fatId = '', poleId = '';
    for (let el of simpleDataElems) {
      const key = el.getAttribute("name");
      const val = el.textContent.trim();
      if (key === "FAT_ID_NETWORK_ID") fatId = val;
      if (key === "Pole_ID__New_") poleId = val;
    }
    if (fatId && poleId) fatToPoleMap.set(fatId, poleId);
  }

  // Extract all rows
  for (let placemark of placemarks) {
    let coordText =
      placemark.getElementsByTagNameNS("http://www.opengis.net/kml/2.2", "coordinates")[0]?.textContent.trim();

    if (!coordText) {
      const gxCoord = placemark.getElementsByTagNameNS("http://www.google.com/kml/ext/2.2", "coord")[0];
      if (gxCoord) coordText = gxCoord.textContent.trim().replace(/\s+/g, ' ');
    }

    const [lonRaw, latRaw] = coordText ? coordText.split(/[ ,]+/).map(v => v.trim()) : ['', ''];
    const lat = latRaw ? parseFloat(latRaw).toFixed(6) : '';
    const lon = lonRaw ? parseFloat(lonRaw).toFixed(6) : '';

    let rowData = {};
    rowData.Latitude = lat;
    rowData.Longitude = lon;

    const simpleDataElems = placemark.getElementsByTagNameNS("*", "SimpleData");
    for (let el of simpleDataElems) {
      const key = el.getAttribute("name");
      if (["HPTAR_ID", "OBJECTID", "Shape_Length", "Shape_Area"].includes(key)) continue;
      const value = el.textContent.trim();
      rowData[key] = value;
      headersSet.add(key);
    }

    const descriptionNode = placemark.getElementsByTagNameNS("*", "description")[0];
    if (descriptionNode && descriptionNode.textContent.includes('<td>')) {
      const descDoc = new DOMParser().parseFromString(descriptionNode.textContent, 'text/html');
      const tds = descDoc.querySelectorAll('td');
      for (let i = 0; i < tds.length - 1; i += 2) {
        const key = tds[i].textContent.trim();
        const value = tds[i + 1].textContent.trim();
        if (["HPTAR_ID", "OBJECTID", "Shape_Length", "Shape_Area"].includes(key)) continue;
        rowData[key] = value;
        headersSet.add(key);
      }
    }

    const fatCode = rowData["FAT_CODE"] || '';
    const poleFat = fatToPoleMap.get(fatCode) || '';
    rowData["POLE_FAT"] = poleFat;
    headersSet.add("POLE_FAT");

    rows.push(rowData);
  }

  // Reorder headers
  let headers = Array.from(headersSet).filter(h => !["Name", "Latitude", "Longitude"].includes(h));
  if (!headers.includes("HOME/BIZ")) headers.push("HOME/BIZ");

  rows.forEach(row => {
    const cat = row["Category_BizPass"];
    row["HOME/BIZ"] = (cat === "RELIGION" || cat === "RESIDENCE") ? "H" : (cat ? "U" : "");
  });

    const preferredOrder = [
    "POST_CODE", "SUB_DISTRICT", "DISTRICT", "POLE_FAT", "FAT_CODE", "FDT_CODE",
    "CLUSTER_NAME", "ID_Area", "PREFIX_ADDRESS", "STREET_NAME", "BLOCK", "HOUSE_NUMBER",
    "RT", "RW", "HOME/BIZ", "HOUSE_COMMENT_", "BUILDING_LATITUDE", "BUILDING_LONGITUDE"
  ];

  const remaining = headers.filter(h => !preferredOrder.includes(h));
  headers = [...preferredOrder, ...remaining, "Latitude", "Longitude"];

  parsedData = { headers, rows };
  showCSVPreview(headers, rows);
}

// --- CSV Preview
function showCSVPreview(headers, rows) {
  let html = `<div style="max-height:400px;width:100%;overflow:auto;margin-top:10px"><table style="border-collapse:collapse;width:100%;font-size:0.8rem"><thead><tr>${headers.map(h => `<th style='border:1px solid #ccc;padding:4px;background:#eee'>${h}</th>`).join('')}</tr></thead><tbody>`;
  for (let r of rows) {
    html += `<tr>${headers.map(h => `<td style='border:1px solid #ccc;padding:4px'>${r[h] || ''}</td>`).join('')}</tr>`;
  }
  html += `</tbody></table></div>`;
  previewContainer.innerHTML = html;
}

// --- Download CSV
convertBtn.addEventListener('click', () => {
  if (!selectedFile) return alert("Please upload a file first.");
  if (!parsedData) return alert('No data to convert.');

  const { headers, rows } = parsedData;
  const csvContent = [
    headers.join(','),
    ...rows.map(r => headers.map(h => {
      let val = r[h] || '';
      if (!isNaN(val) && val.includes('.')) {
        const num = parseFloat(val);
        if (!isNaN(num)) val = num.toFixed(6);
      }
      return `"${val.replace(/"/g, '""')}"`;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${selectedFile.name.replace(/\.[^/.]+$/, '')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
});
