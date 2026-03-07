const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, 'index.html');
const svgPath = path.join(__dirname, 'assets', 'images', 'avatar-outline.svg');

let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
let svgContent = fs.readFileSync(svgPath, 'utf8');

// The regex matches <div class="hero-avatar"> ... </div>
const svgRegex = /<div class="hero-avatar">\s*<svg[\s\S]*?<\/svg>\s*<\/div>/;

// Add responsive classes/attributes to the new SVG
svgContent = svgContent.replace('<svg ', '<svg class="avatar-svg" preserveAspectRatio="xMidYMid meet" ');

// ensure it doesn't have absolute width/height if it interferes with responsiveness
svgContent = svgContent.replace(/width="\d+"/, 'width="100%"').replace(/height="\d+"/, 'height="100%"');

const replacement = `<div class="hero-avatar">\n                ${svgContent.trim()}\n            </div>`;

const newIndexHtml = indexHtml.replace(svgRegex, replacement);

fs.writeFileSync(indexHtmlPath, newIndexHtml, 'utf8');
console.log('SVG replaced successfully!');
