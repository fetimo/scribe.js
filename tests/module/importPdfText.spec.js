// Relative imports are required to run in browser.
/* eslint-disable import/no-relative-packages */
import { assert, config } from '../../node_modules/chai/chai.js';
// import mocha from '../../node_modules/mocha/mocha.js';
import scribe from '../../scribe.js';
import { ASSETS_PATH_KARMA } from '../constants.js';

config.truncateThreshold = 0; // Disable truncation for actual/expected values on assertion failure.

// Using arrow functions breaks references to `this`.
/* eslint-disable prefer-arrow-callback */
/* eslint-disable func-names */

// This file contains many seemingly duplicative tests.
// In all cases, there are slight differences in the PDFs being imported, such that one test may fail while another passes.

describe('Check stext import function language support.', function () {
  this.timeout(10000);
  before(async () => {
    await scribe.importFiles([`${ASSETS_PATH_KARMA}/chi_eng_mixed_sample.pdf`], { extractPDFTextNative: true, extractPDFTextOCR: true });
  });

  it('Should import Chinese characters', async () => {
    const text1 = scribe.data.ocr.active[0].lines[2].words.map((x) => x.text).join(' ');

    assert.strictEqual(text1, '嚴 重 特 殊 傳 染 性 肺 炎 指 定 處 所 隔 離 通 知 書 及 提 審 權 利 告 知');
  }).timeout(10000);

  after(async () => {
    await scribe.terminate();
  });
}).timeout(120000);

describe('Check small caps are detected in PDF imports.', function () {
  this.timeout(10000);
  before(async () => {
    await scribe.importFiles([`${ASSETS_PATH_KARMA}/small_caps_examples.pdf`], { extractPDFTextNative: true, extractPDFTextOCR: true });
  });

  it('Should correctly import small caps printed using font size adjustments', async () => {
    const text1 = scribe.data.ocr.active[0].lines[3].words.map((x) => x.text).join(' ');

    const text2 = scribe.data.ocr.active[0].lines[22].words.map((x) => x.text).join(' ');

    assert.strictEqual(text1, 'Shubhdeep Deb');

    assert.strictEqual(text2, 'Wage inequality in the United States has risen sharply since the 1980s. The skill');
  }).timeout(10000);

  it('Should correctly import small caps printed using small caps font.', async () => {
    assert.strictEqual(scribe.data.ocr.active[1].lines[4].words[0].smallCaps, true);

    assert.strictEqual(scribe.data.ocr.active[1].lines[4].words.map((x) => x.text).join(' '), 'Abstract');
  }).timeout(10000);

  after(async () => {
    await scribe.terminate();
  });
}).timeout(120000);

describe('Check superscripts are detected in PDF imports.', function () {
  this.timeout(10000);
  before(async () => {
    await scribe.importFiles([`${ASSETS_PATH_KARMA}/superscript_examples.pdf`], { extractPDFTextNative: true, extractPDFTextOCR: true });
  });

  // First document
  it('Should correctly import trailing superscripts printed using font size adjustments (1st doc)', async () => {
    assert.strictEqual(scribe.data.ocr.active[0].lines[25].words[8].sup, true);
    assert.strictEqual(scribe.data.ocr.active[0].lines[25].words[8].text, '1');
  }).timeout(10000);

  it('Should correctly import leading superscripts printed using font size adjustments (1st doc)', async () => {
    assert.strictEqual(scribe.data.ocr.active[0].lines[43].words[0].sup, true);
    assert.strictEqual(scribe.data.ocr.active[0].lines[43].words[0].text, '1');
  }).timeout(10000);

  it('Should correctly calculate line angle for lines that start or end with superscripts (1st doc)', async () => {
    // Line that ends with superscript.
    assert.strictEqual(scribe.data.ocr.active[0].lines[28].baseline[0], 0);
    // Line that starts with superscript.
    assert.strictEqual(scribe.data.ocr.active[0].lines[43].baseline[0], 0);
  }).timeout(10000);

  // Second document
  it('Should correctly import trailing superscripts printed using font size adjustments (2nd doc)', async () => {
    assert.strictEqual(scribe.data.ocr.active[1].lines[1].words[2].sup, true);
    assert.strictEqual(scribe.data.ocr.active[1].lines[1].words[2].text, '1');
  }).timeout(10000);

  it('Should correctly import leading superscripts printed using font size adjustments (2nd doc)', async () => {
    assert.strictEqual(scribe.data.ocr.active[1].lines[36].words[0].sup, true);
    assert.strictEqual(scribe.data.ocr.active[1].lines[36].words[0].text, '1');
  }).timeout(10000);

  it('Should correctly calculate line angle for lines that start with superscripts (2nd doc)', async () => {
    // Line that starts with superscript.
    assert.strictEqual(scribe.data.ocr.active[1].lines[36].baseline[0], 0);
  }).timeout(10000);

  // Third document
  it('Should correctly import leading superscripts printed using font size adjustments (3rd doc)', async () => {
    assert.strictEqual(scribe.data.ocr.active[2].lines[24].words[0].sup, true);
    assert.strictEqual(scribe.data.ocr.active[2].lines[24].words[0].text, '2');
  }).timeout(10000);

  it('Should correctly parse font size for lines with superscripts (3rd doc)', async () => {
    const words = scribe.data.ocr.active[2].lines[24].words;
    assert.isTrue(words.map((word) => word.size && Math.round(word.size) === 29).reduce((acc, val) => acc && val));
  }).timeout(10000);

  // Forth document
  it('Should correctly import trailing superscripts printed using font size adjustments (4th doc)', async () => {
    assert.strictEqual(scribe.data.ocr.active[3].lines[114].words[2].sup, true);
    assert.strictEqual(scribe.data.ocr.active[3].lines[114].words[2].text, '20');
  }).timeout(10000);

  it('Should correctly parse font size for lines with superscripts (4th doc)', async () => {
    assert.strictEqual(scribe.data.ocr.active[3].lines[250].words[1].sup, true);
    assert.strictEqual(scribe.data.ocr.active[3].lines[250].words[1].text, '20');
  }).timeout(10000);

  // Fifth document
  it('Should correctly import trailing superscripts printed using font size adjustments (4th doc)', async () => {
    assert.strictEqual(scribe.data.ocr.active[4].lines[11].words[16].sup, true);
    assert.strictEqual(scribe.data.ocr.active[4].lines[11].words[16].text, '2');
  }).timeout(10000);

  it('Should correctly parse font size for lines with superscripts (4th doc)', async () => {
    assert.strictEqual(scribe.data.ocr.active[4].lines[21].words[0].sup, true);
    assert.strictEqual(scribe.data.ocr.active[4].lines[21].words[0].text, '2');
  }).timeout(10000);

  after(async () => {
    await scribe.terminate();
  });
}).timeout(120000);
