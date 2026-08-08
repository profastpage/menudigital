// Find the syntax error in the generated menu HTML's <script> tag using Node's parser
import * as fs from 'fs';
import * as vm from 'vm';

const html = fs.readFileSync('/home/z/my-project/download/test-menu.html', 'utf-8');

const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.log('No inline script found');
  process.exit(1);
}

const scriptContent = scriptMatch[1];
console.log('Script length:', scriptContent.length);

// Use vm.Script to find syntax errors with line numbers
try {
  new vm.Script(scriptContent, { filename: 'menu-script.js' });
  console.log('No syntax error found');
} catch (e: any) {
  console.log('Syntax error:');
  console.log(e.message);
  console.log('Stack:', e.stack?.split('\n').slice(0, 5).join('\n'));
  
  // Try to extract line:column from the error
  const m = e.stack?.match(/menu-script\.js:(\d+)/);
  if (m) {
    const lineNum = parseInt(m[1]);
    const lines = scriptContent.split('\n');
    const start = Math.max(0, lineNum - 3);
    const end = Math.min(lines.length, lineNum + 3);
    console.log(`\n--- context around line ${lineNum} ---`);
    for (let i = start; i < end; i++) {
      const marker = i === lineNum - 1 ? '>>>' : '   ';
      console.log(`${marker} L${i + 1}: ${lines[i]}`);
    }
  }
}
