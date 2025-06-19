/* Global Reset */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Body Layout */
body {
  font-family: 'Segoe UI', sans-serif;
  background: linear-gradient(to bottom right, #03a8df, #ffe655);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  text-align: center;
  color: white;
  min-height: 100vh;
  padding-top: 40px;
}

/* Container */
.container {
  background-color: rgba(0, 106, 148, 0.15);
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 100%;
  backdrop-filter: blur(10px);
}

/* Header & Subtitle */
h1 {
  font-size: 2rem;
  margin-bottom: 10px;
}

.subtitle {
  font-size: 1rem;
  margin-bottom: 10px;
}

.powered-by a {
  color: #cedb47;
  text-decoration: underline;
}

/* Dropdown */
.dropdown-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 15px;
}

.conversion-dropdown {
  padding: 10px 20px;
  background-color: #207bb5;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg fill='white' height='20' viewBox='0 0 24 24' width='20' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 14px;
  padding-right: 35px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease;
}

.conversion-dropdown:hover {
  background-color: #2a8ed1;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* Upload Box */
.upload-box {
  background: white;
  border-radius: 12px;
  padding: 25px;
  margin: 20px 0;
  color: #333;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

/* Drag & Drop Area */
.upload-area {
  border: 2px dashed #ccc;
  padding: 30px;
  margin-bottom: 10px;
  border-radius: 10px;
  font-size: 1.1rem;
  cursor: pointer;
  background: #f9f9f9;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: 0.2s;
}

.upload-area.dragover {
  border-color: #4caf50;
  background-color: #f0f0f0;
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.4);
}

/* Terms */
.terms {
  font-size: 0.75rem;
  color: #000000;
  margin-top: 10px;
}

.terms a {
  color: #000000;
  text-decoration: underline;
}

/* Action Button */
.action-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 20px;
}

.convert-btn {
  background: linear-gradient(to bottom, #4caf50, #388e3c);
  color: white;
  padding: 10px 25px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
}

.convert-btn:hover {
  background: linear-gradient(to bottom, #66bb6a, #43a047);
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.35);
  transform: translateY(-1px);
}

/* CSV Preview Table */
.csv-preview {
  margin-top: 20px;
  overflow-x: auto;
  color: black;
}

.csv-preview table {
  border-collapse: collapse;
  width: 100%;
}

.csv-preview th,
.csv-preview td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: left;
  background-color: #fff;
}

.csv-preview th {
  background-color: #e0e0e0;
}
