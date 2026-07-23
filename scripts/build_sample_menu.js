// Extract buildMenuHTML from generador.html and produce a sample menu.html
const fs = require('fs');
const path = require('path');

const genPath = '/home/z/my-project/download/generador.html';
const outPath = '/home/z/my-project/download/menu-ejemplo.html';

const html = fs.readFileSync(genPath, 'utf8');

// Extract the main <script> block (the last one)
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error('No script block found');
  process.exit(1);
}
const scriptCode = scriptMatch[1];

// Mock DOM globals so the script can run
function makeMockEl() {
  return {
    value: '',
    style: {},
    classList: { add:function(){},remove:function(){},toggle:function(){},contains:function(){return false;} },
    querySelector: function(){ return makeMockEl(); },
    querySelectorAll: function(){ return []; },
    addEventListener: function(){},
    appendChild: function(){},
    removeChild: function(){},
    remove: function(){},
    click: function(){},
    setAttribute: function(){},
    innerHTML: ''
  };
}
global.document = {
  getElementById: function(){ return makeMockEl(); },
  querySelectorAll: function(){ return []; },
  createElement: function(){ return makeMockEl(); },
  body: makeMockEl(),
  documentElement: { style: { setProperty: function(){} } }
};
global.window = { addEventListener: function(){}, open: function(){}, scrollTo: function(){}, pageYOffset: 0 };
global.setTimeout = setTimeout;
global.URL = { createObjectURL: function(){return '';}, revokeObjectURL: function(){} };
global.Blob = function(){};

// Run the script in this scope so buildMenuHTML becomes available
try { eval(scriptCode); } catch (e) {
  console.error('Eval error:', e.message);
  // Continue - buildMenuHTML may still be defined
}

// Sample restaurant data
const sampleData = {
  name: "La Parrilla del Chef",
  description: "Auténtica cocina peruana con ingredientes frescos del mercado. Especialistas en parrillas y mariscos.",
  whatsapp: "51987654321",
  logo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop",
  color: "#ff6b35",
  categories: [
    {
      name: "Entradas",
      dishes: [
        { name: "Ceviche Clásico", description: "Pescado fresco marinado en limón, cebolla, cilantro y ají limo. Acompañado de camote y choclo.", price: 28.00, image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300&h=300&fit=crop" },
        { name: "Causa Limeña", description: "Papa amarilla seasoned con ají amarillo, rellena de pollo y palta.", price: 22.00, image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=300&h=300&fit=crop" },
        { name: "Anticuchos", description: "Brochetas de corazón de res marinadas en ají panca. 4 unidades.", price: 25.00, image: "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=300&h=300&fit=crop" }
      ]
    },
    {
      name: "Platos de Fondo",
      dishes: [
        { name: "Lomo Saltado", description: "Salteado de lomo de res con cebolla, tomate y papas fritas. Servido con arroz blanco.", price: 35.00, image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=300&h=300&fit=crop" },
        { name: "Ají de Gallina", description: "Crema de pollo deshilachado en ají amarillo con nueces y parmesano. Acompañado de arroz.", price: 30.00, image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=300&h=300&fit=crop" },
        { name: "Chaufa de Mariscos", description: "Arroz chaufa con camarones, calamares y pescado. Estilo peruano-chino.", price: 38.00, image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300&h=300&fit=crop" }
      ]
    },
    {
      name: "Bebidas",
      dishes: [
        { name: "Chicha Morada", description: "Bebida tradicional de maíz morado con piña, canela y clavo.", price: 8.00, image: "https://images.unsplash.com/photo-1623083099089-c2a3e3dd5d71?w=300&h=300&fit=crop" },
        { name: "Maracuyá Sour", description: "Coctel de maracuyá con pisco quequeperuano. Sin alcohol disponible.", price: 18.00, image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=300&h=300&fit=crop" },
        { name: "Inca Kola", description: "Gaseosa peruana 500ml.", price: 6.00, image: "https://images.unsplash.com/photo-1624552184280-9e9631bbeee9?w=300&h=300&fit=crop" }
      ]
    }
  ]
};

const menuHTML = buildMenuHTML(sampleData);
fs.writeFileSync(outPath, menuHTML, 'utf8');
console.log('Sample menu generated at:', outPath);
console.log('Size:', menuHTML.length, 'bytes');

// Sanity check: ensure no unclosed script tags or broken JSON
if (menuHTML.indexOf('</scr' + 'ipt>') === -1 && menuHTML.indexOf('</script>') === -1) {
  console.error('WARNING: no closing script tag found');
}
console.log('Contains RESTAURANT var:', menuHTML.indexOf('var RESTAURANT =') !== -1);
console.log('Contains renderApp call:', menuHTML.indexOf('renderApp();') !== -1);
