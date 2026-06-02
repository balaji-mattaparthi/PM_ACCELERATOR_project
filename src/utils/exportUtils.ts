/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import { WeatherReport } from '../types';

// 1. CSV Export
export const exportToCSV = (weatherReports: WeatherReport[]) => {
  if (weatherReports.length === 0) return;

  const headers = ['City/Location', 'Temperature (°C)', 'Humidity (%)', 'Wind Speed (km/h)', 'Weather Condition', 'Forecast', 'Searched Date/Time', 'Notes'];
  const rows = weatherReports.map((r) => [
    `"${r.city.replace(/"/g, '""')}"`,
    `${r.temperature}°C`,
    `${r.humidity}%`,
    `${r.windSpeed !== undefined ? r.windSpeed : 15} km/h`,
    `"${r.weatherCondition}"`,
    `"${(r.forecast || 'Stable weather outlook').replace(/"/g, '""')}"`,
    `"${r.date} ${r.createdAt ? new Date(r.createdAt).toLocaleTimeString() : ''}"`,
    `"${(r.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `nimbus_weather_export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 2. JSON Export
export const exportToJSON = (weatherReports: WeatherReport[]) => {
  if (weatherReports.length === 0) return;

  const formattedData = weatherReports.map(r => ({
    city: r.city,
    temperature: `${r.temperature}°C`,
    humidity: `${r.humidity}%`,
    windSpeed: `${r.windSpeed !== undefined ? r.windSpeed : 15} km/h`,
    condition: r.weatherCondition,
    forecast: r.forecast || 'Stable weather outlook',
    searchedDateTime: `${r.date} ${r.createdAt ? new Date(r.createdAt).toLocaleTimeString() : ''}`,
    notes: r.notes || ''
  }));

  const jsonString = JSON.stringify(formattedData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `nimbus_weather_export_${new Date().toISOString().split('T')[0]}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 3. XML Export
export const exportToXML = (weatherReports: WeatherReport[]) => {
  if (weatherReports.length === 0) return;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<weather_database>\n`;
  xml += `  <metadata>\n`;
  xml += `    <generated_at>${new Date().toISOString()}</generated_at>\n`;
  xml += `    <lead_engineer>Balaji Mattaparthi</lead_engineer>\n`;
  xml += `    <partner_organization>Product Management Accelerator (PM Accelerator)</partner_organization>\n`;
  xml += `  </metadata>\n`;
  xml += `  <records>\n`;

  weatherReports.forEach((r) => {
    const cleanCity = r.city.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const cleanForecast = (r.forecast || 'Stable weather outlook').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const cleanNotes = (r.notes || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const dateStr = `${r.date} ${r.createdAt ? new Date(r.createdAt).toLocaleTimeString() : ''}`;

    xml += `    <weather>\n`;
    xml += `      <city>${cleanCity}</city>\n`;
    xml += `      <temperature>${r.temperature}°C</temperature>\n`;
    xml += `      <humidity>${r.humidity}%</humidity>\n`;
    xml += `      <wind_speed>${r.windSpeed !== undefined ? r.windSpeed : 15} km/h</wind_speed>\n`;
    xml += `      <condition>${r.weatherCondition}</condition>\n`;
    xml += `      <forecast>${cleanForecast}</forecast>\n`;
    xml += `      <datetime>${dateStr}</datetime>\n`;
    xml += `      <notes>${cleanNotes}</notes>\n`;
    xml += `    </weather>\n`;
  });

  xml += `  </records>\n`;
  xml += `</weather_database>\n`;

  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `nimbus_weather_export_${new Date().toISOString().split('T')[0]}.xml`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 4. Markdown Export
export const exportToMarkdown = (weatherReports: WeatherReport[]) => {
  if (weatherReports.length === 0) return;

  let md = `# Weather Report\n\n`;
  md += `*Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}*\n`;
  md += `*Lead Software Engineer: **Balaji Mattaparthi***\n`;
  md += `*Partner Organization: **Product Management Accelerator (PM Accelerator)***\n\n`;
  md += `| City/Location | Temperature | Humidity | Wind Speed | Condition | Forecast | Searched Date/Time | Notes |\n`;
  md += `| --- | --- | --- | --- | --- | --- | --- | --- |\n`;

  weatherReports.forEach((r) => {
    const timeStr = r.createdAt ? new Date(r.createdAt).toLocaleTimeString() : '';
    md += `| ${r.city} | ${r.temperature}°C | ${r.humidity}% | ${r.windSpeed !== undefined ? r.windSpeed : 15} km/h | ${r.weatherCondition} | ${r.forecast || 'Stable weather outlook'} | ${r.date} ${timeStr} | ${r.notes || '—'} |\n`;
  });

  md += `\n\n---\n*Nimbus Live Weather System - Empowering sustainable zero-cost meteorological ground-truth validation with direct support of PM Accelerator.*`;

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `nimbus_weather_export_${new Date().toISOString().split('T')[0]}.md`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 5. PDF Export
export const exportToPDF = (weatherReports: WeatherReport[]) => {
  if (weatherReports.length === 0) return;

  try {
    const doc = new jsPDF();
    
    // Header Banner
    doc.setFillColor(14, 165, 233); // sky-500 color
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('WEATHER DATABASE REPORT', 15, 22);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Nimbus Atmospheric Ledger & Ground Truth Logs', 15, 30);
    
    // Metadata fields
    doc.setTextColor(100, 116, 139); // slate-500
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'bold');
    doc.text('Lead Software Engineer:', 15, 52);
    doc.setFont('Helvetica', 'normal');
    doc.text('Balaji Mattaparthi', 55, 52);
    
    doc.setFont('Helvetica', 'bold');
    doc.text('Partner Accelerator:', 15, 58);
    doc.setFont('Helvetica', 'normal');
    doc.text('Product Management Accelerator (PM Accelerator)', 55, 58);
    
    doc.setFont('Helvetica', 'bold');
    doc.text('Document Compiled:', 15, 64);
    doc.setFont('Helvetica', 'normal');
    doc.text(`${new Date().toUTCString()}`, 55, 64);
    
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(15, 70, 195, 70);
    
    // Records block
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'bold');
    doc.text('STORED WEATHER DATABASE RECORDS', 15, 80);
    
    let y = 98;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    
    doc.text('City', 15, 90);
    doc.text('Date/Time', 50, 90);
    doc.text('Temp', 85, 90);
    doc.text('Hum', 100, 90);
    doc.text('Wind', 115, 90);
    doc.text('Condition', 130, 90);
    doc.text('Forecast / Outlook', 155, 90);
    
    doc.line(15, 92, 195, 92);
    
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    
    weatherReports.forEach((r) => {
      if (y > 275) {
        doc.addPage();
        y = 30;
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(71, 85, 105);
        doc.text('City', 15, 20);
        doc.text('Date/Time', 50, 20);
        doc.text('Temp', 85, 20);
        doc.text('Hum', 100, 20);
        doc.text('Wind', 115, 20);
        doc.text('Condition', 130, 20);
        doc.text('Forecast / Outlook', 155, 20);
        doc.line(15, 22, 195, 22);
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
      }
      
      const cityStr = r.city.length > 15 ? r.city.substring(0, 13) + '..' : r.city;
      const forecastStr = (r.forecast || 'Stable').length > 18 ? (r.forecast || 'Stable').substring(0, 16) + '..' : (r.forecast || 'Stable');
      const timeStr = r.createdAt ? new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
      const fullDate = `${r.date} ${timeStr}`;
      
      doc.text(cityStr, 15, y);
      doc.text(fullDate, 50, y);
      doc.text(`${r.temperature}°C`, 85, y);
      doc.text(`${r.humidity}%`, 100, y);
      doc.text(`${r.windSpeed !== undefined ? r.windSpeed : 15} k/h`, 115, y);
      doc.text(r.weatherCondition, 130, y);
      doc.text(forecastStr, 155, y);
      
      y += 8;
    });
    
    // Footer text on page
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('Empowered by research models of open-meteo, openstreetmap nominations, and server-side gemini advisor recommendation nodes.', 15, 287);
    
    doc.save(`nimbus_weather_export_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (err) {
    console.error(err);
  }
};
