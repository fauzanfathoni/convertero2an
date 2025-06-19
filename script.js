// script.js

const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const uploadText = document.getElementById('upload-text');
const convertBtn = document.querySelector('.convert-btn');
const previewContainer = document.getElementById('preview-table');
const conversionSelect = document.getElementById('conversion-type');
const headerTitle = document.querySelector('h1');

let selectedFile = null;
let parsedData = null;
let currentMode = "KML to CSV";

conversionSelect.addEventListener('change', () => {
  currentMode = conversionSelect.value;
  headerTitle.textContent = `${currentMode} Converter`;
  resetUI();
});

function resetUI() {
  selectedFile = null;
  parsedData = null;
  uploadText.innerHTML = "<br>*Drop or upload your file here*";
  previewContainer.innerHTML = "";
}

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
fileInput.addEventListener('change', () => {
  handleFile(fileInput.files[0]);
});

function handleFile(file) {
  if (!file) return;

  if (currentMode === "KML to CSV") {
    if (!file.name.endsWith('.kml') && !file.name.endsWith('.kmz')) {
      return alert("Please upload a .kml or .kmz file.");
    }
    selectedFile = file;
    uploadText.innerHTML = `<strong>Convert :</strong> ${file.name}`;
    if (file.name.endsWith('.kmz')) {
      JSZip.loadAsync(file).then(zip => {
        const kmlFile = Object.values(zip.files).find(f => f.name.endsWith('.kml'));
        if (kmlFile) return kmlFile.async('text');
        else alert('KML not found in KMZ.');
      }).then(kmlText => {
        if (kmlText) parseKML(kmlText);
      });
    } else {
      file.text().then(kmlText => parseKML(kmlText));
    }
  } else if (currentMode === "DWG to DGN" || currentMode === "DWG to DXF") {
    if (!file.name.endsWith('.dwg')) {
      return alert("Please upload a .dwg file.");
    }
    selectedFile = file;
    uploadText.innerHTML = `<strong>Convert DWG:</strong> ${file.name}`;
    previewContainer.innerHTML = `<p style='color:black'>Ready to convert ${currentMode}.</p>`;
  }
}

function parseKML(kmlText) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(kmlText, "text/xml");
  const placemarks = xml.getElementsByTagNameNS("http://www.opengis.net/kml/2.2", "Placemark");
  let rows = [];
  let headersSet = new Set();
  let fatToPoleMap = new Map();

  for (let placemark of placemarks) {
    const simpleDataElems = placemark.getElementsByTagNameNS("http://www.opengis.net/kml/2.2", "SimpleData");
    let fatId = '', poleId = '';
    for (let el of simpleDataElems) {
      const key = el.getAttribute("name");
      const val = el.textContent.trim();
      if (key === "FAT_ID_NETWORK_ID") fatId = val;
      if (key === "Pole_ID__New_") poleId = val;
    }
    if (fatId && poleId) fatToPoleMap.set(fatId, poleId);
  }

  for (let placemark of placemarks) {
    const coordText = placemark.getElementsByTagNameNS("http://www.opengis.net/kml/2.2", "coordinates")[0]?.textContent.trim() || '';
    const [lonRaw, latRaw] = coordText.split(',').map(v => v.trim());
    const lat = latRaw ? parseFloat(latRaw).toFixed(6) : '';
    const lon = lonRaw ? parseFloat(lonRaw).toFixed(6) : '';

    let rowData = {};
    rowData.Latitude = lat;
    rowData.Longitude = lon;

    const simpleDataElems = placemark.getElementsByTagNameNS("http://www.opengis.net/kml/2.2", "SimpleData");
    for (let el of simpleDataElems) {
      const key = el.getAttribute("name");
      if (["HPTAR_ID", "OBJECTID", "Shape_Length", "Shape_Area"].includes(key)) continue;
      const value = el.textContent.trim();
      rowData[key] = value;
      headersSet.add(key);
    }

    const descriptionNode = placemark.getElementsByTagNameNS("http://www.opengis.net/kml/2.2", "description")[0];
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

  let headers = Array.from(headersSet).filter(h => h !== "POLE_FAT"); // hapus semua POLE_FAT dulu
  const fatIdx = headers.indexOf("FAT_CODE");
  if (fatIdx !== -1) headers.splice(fatIdx + 1, 0, "POLE_FAT"); // sisipkan hanya sekali setelah FAT_CODE
  const catIdx = headers.indexOf("Category_BizPass");
  if (catIdx !== -1) headers.splice(catIdx + 1, 0, "HOME/BIZ");
  else headers.push("HOME/BIZ");

  rows.forEach(row => {
    const cat = row["Category_BizPass"];
    if (cat === "RELIGION" || cat === "RESIDENCE") row["HOME/BIZ"] = "H";
    else if (cat) row["HOME/BIZ"] = "U";
    else row["HOME/BIZ"] = "";
  });

  headers = headers.filter(h => !["Name", "Latitude", "Longitude"].includes(h));

  parsedData = { headers, rows };
  showCSVPreview(headers, rows);
}

function showCSVPreview(headers, rows) {
  let html = `<div style="max-height:400px;width:100%;overflow:auto;margin-top:10px"><table style="border-collapse:collapse;width:100%;font-size:0.8rem"><thead><tr>${headers.map(h => `<th style='border:1px solid #ccc;padding:4px;background:#eee'>${h}</th>`).join('')}</tr></thead><tbody>`;
  for (let r of rows) {
    html += `<tr>${headers.map(h => `<td style='border:1px solid #ccc;padding:4px'>${r[h] || ''}</td>`).join('')}</tr>`;
  }
  html += `</tbody></table></div>`;
  previewContainer.innerHTML = html;
}

convertBtn.addEventListener('click', () => {
  if (!selectedFile) return alert("Please upload a file first.");

  if (currentMode === "KML to CSV") {
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
  }

  if (currentMode === "DWG to DGN" || currentMode === "DWG to DXF") {
    const ext = currentMode.endsWith("DGN") ? "dgn" : "dxf";
    const blob = new Blob([`Simulated ${ext.toUpperCase()} content`], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedFile.name.replace(/\.[^/.]+$/, '')}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }
});
