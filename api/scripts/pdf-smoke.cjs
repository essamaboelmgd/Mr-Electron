const fs = require('fs');
const os = require('os');
const path = require('path');
const PDFDocument = require('pdfkit');

const fontCandidates = [
  process.env.PDF_FONT_PATH,
  path.resolve(process.cwd(), 'assets/fonts/NotoSansArabic-Regular.ttf'),
  '/usr/share/fonts/google-noto-vf/NotoSansArabic[wght].ttf',
  '/usr/share/fonts/google-noto-vf/NotoNaskhArabic[wght].ttf',
  '/usr/share/fonts/truetype/noto/NotoSansArabic-Regular.ttf'
].filter(Boolean);
const font = fontCandidates.find((candidate) => fs.existsSync(candidate));
if (!font) {
  throw new Error('Arabic PDF font not found. Set PDF_FONT_PATH or install Noto Sans Arabic.');
}

const target = path.join(os.tmpdir(), `mr-electron-pdf-smoke-${process.pid}.pdf`);
const document = new PDFDocument({ size: 'A4', margin: 42 });
document.font(font).fontSize(16).text('اختبار تقرير Mr Electron', { align: 'right' });
const output = fs.createWriteStream(target);
output.on('finish', () => {
  const content = fs.readFileSync(target);
  if (content.subarray(0, 4).toString() !== '%PDF') throw new Error('Generated file is not a PDF.');
  if (!content.includes(Buffer.from('/FontFile'))) throw new Error('PDF does not contain the embedded Arabic font.');
  fs.unlinkSync(target);
  console.log('PDF smoke test passed.');
});
output.on('error', (error) => {
  if (fs.existsSync(target)) fs.unlinkSync(target);
  throw error;
});
document.pipe(output);
document.end();
document.on('error', (error) => {
  if (fs.existsSync(target)) fs.unlinkSync(target);
  throw error;
});
