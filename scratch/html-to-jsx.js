const fs = require('fs');

function convertHtmlToJsx(htmlStr) {
  let content = htmlStr;
  
  // Try to extract body content
  let bodyMatch = htmlStr.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    content = bodyMatch[1];
  }
  
  // Remove navbar and canvas and footer and scripts
  content = content.replace(/<canvas[^>]*>[\s\S]*?<\/canvas>/gi, '');
  content = content.replace(/<div id="sofe-navbar"[\s\S]*?<\/div>/gi, '');
  content = content.replace(/<footer[\s\S]*?<\/footer>/gi, '');
  content = content.replace(/<script[\s\S]*?<\/script>/gi, '');
  content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Basic JSX replacements
  content = content.replace(/class=/g, 'className=');
  content = content.replace(/for=/g, 'htmlFor=');
  content = content.replace(/<br>/g, '<br />');
  content = content.replace(/<hr>/g, '<hr />');
  content = content.replace(/<img([^>]*[^/])>/g, '<img$1 />');
  content = content.replace(/<input([^>]*[^/])>/g, '<input$1 />');
  content = content.replace(/<!--([\s\S]*?)-->/g, '{/* $1 */}');
  
  // Fix inline styles
  content = content.replace(/style="([^"]*)"/g, (match, p1) => {
    let styles = p1.split(';').filter(s => s.trim() !== '');
    let jsxStyles = {};
    styles.forEach(s => {
      let parts = s.split(':');
      let key = parts.shift();
      let val = parts.join(':');
      if (key && val) {
        key = key.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
        jsxStyles[key] = val.trim();
      }
    });
    return 'style={' + JSON.stringify(jsxStyles) + '}';
  });

  return content;
}

function processFile(inFile, outFile, componentName) {
  if (!fs.existsSync(inFile)) {
    console.log(`Skipping ${inFile}`);
    return;
  }
  const html = fs.readFileSync(inFile, 'utf-8');
  let jsxContent = convertHtmlToJsx(html);

  let finalCode = `'use client';
import React from 'react';
import Link from 'next/link';

export default function ${componentName}() {
  return (
    <>
      ${jsxContent}
    </>
  );
}
`;
  fs.writeFileSync(outFile, finalCode);
  console.log(`Converted ${inFile} to ${outFile}`);
}

processFile('public/bie.html', 'components/BieClient.jsx', 'BieClient');
processFile('public/bce.html', 'components/BceClient.jsx', 'BceClient');
processFile('public/about.html', 'components/AboutClient.jsx', 'AboutClient');
processFile('public/academy.html', 'components/AcademyClient.jsx', 'AcademyClient');
processFile('public/blog.html', 'components/BlogClient.jsx', 'BlogClient');
processFile('public/bounties.html', 'components/BountiesClient.jsx', 'BountiesClient');
processFile('public/for-ecosystems.html', 'components/PartnersClient.jsx', 'PartnersClient');
processFile('public/for-talents.html', 'components/TalentClient.jsx', 'TalentClient');
