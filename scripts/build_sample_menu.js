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

// Sample restaurant data — premium version
const sampleData = {
  name: "La Parrilla del Chef",
  slogan: "Cocina de autor desde 1998",
  description: "Auténtica cocina peruana con ingredientes frescos del mercado. Especialistas en parrillas, mariscos y fusión Nikkei.",
  whatsapp: "51987654321",
  logo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=300&fit=crop",
  color: "#d4af37",
  currency: "S/",
  categories: [
    {
      name: "Entradas",
      dishes: [
        { name: "Ceviche Clásico", description: "Pescado fresco marinado en limón, cebolla, cilantro y ají limo. Acompañado de camote y choclo.", price: 28.00, image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=400&fit=crop" },
        { name: "Causa Limeña", description: "Papa amarilla al ají amarillo, rellena de pollo y palta. Estilo tradicional limeño.", price: 22.00, image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=400&fit=crop" },
        { name: "Anticuchos de Corazón", description: "Brochetas de corazón de res marinadas en ají panca. 4 unidades con papita dorada.", price: 25.00, image: "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=400&h=400&fit=crop" }
      ]
    },
    {
      name: "Platos de Fondo",
      dishes: [
        { name: "Lomo Saltado Premium", description: "Salteado de lomo de res wagyu con cebolla, tomate y papas fritas. Servido con arroz blanco jazmín.", price: 45.00, image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=400&fit=crop" },
        { name: "Ají de Gallina", description: "Crema de pollo deshilachado en ají amarillo con nueces y parmesano. Acompañado de arroz y huevo.", price: 32.00, image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&h=400&fit=crop" },
        { name: "Chaufa de Mariscos", description: "Arroz chaufa con camarones, calamares, pescado y huevo. Estilo peruano-chino.", price: 38.00, image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=400&fit=crop" },
        { name: "Parrillada del Chef", description: "Selección de carnes a la parrilla: lomo, costilla, pollo y chorizo. Para 2 personas.", price: 95.00, image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop" }
      ]
    },
    {
      name: "Bebidas",
      dishes: [
        { name: "Chicha Morada", description: "Bebida tradicional de maíz morado con piña, canela y clavo. Casera.", price: 8.00, image: "https://images.unsplash.com/photo-1623083099089-c2a3e3dd5d71?w=400&h=400&fit=crop" },
        { name: "Maracuyá Sour", description: "Coctel de maracuyá con pisco quequeperuano. Versión sin alcohol disponible.", price: 18.00, image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&h=400&fit=crop" },
        { name: "Pisco Sour Clásico", description: "El coctel peruano por excelencia. Pisco quequeperuano, limón, clara de huevo y amargo de angostura.", price: 22.00, image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=400&fit=crop" }
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
