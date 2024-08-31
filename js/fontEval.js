import { DebugData, fontMetricsObj, pageMetricsArr } from './containers/dataContainer.js';
import { fontAll } from './containers/fontContainer.js';
import { ImageCache } from './containers/imageContainer.js';
import {
  enableFontOpt,
  loadBuiltInFontsRaw,
  optimizeFontContainerAll, setDefaultFontAuto,
} from './fontContainerMain.js';
import { gs } from './generalWorkerMain.js';

/**
 * Evaluate how well a font matches the provided array of pages.
 * @param {FontContainerFamily} font
 * @param {Array<OcrPage>} pageArr
 * @param {boolean} opt - Whether to use optimized fonts.
 * @param {number} n - Number of words to compare
 */
export async function evalPagesFont(font, pageArr, opt, n = 500) {
  if (!gs.scheduler) throw new Error('GeneralScheduler must be defined before this function can run.');

  let metricTotal = 0;
  let wordsTotal = 0;

  for (let i = 0; i < pageArr.length; i++) {
    if (wordsTotal > n) break;

    const imageI = await ImageCache.getBinary(i);

    // The Node.js canvas package does not currently support worker threads
    // https://github.com/Automattic/node-canvas/issues/1394
    let res;
    if (!(typeof process === 'undefined')) {
      const { evalPageFont } = await import('./worker/compareOCRModule.js');

      res = await evalPageFont({
        font: font.normal.family,
        page: pageArr[i],
        binaryImage: imageI,
        pageMetricsObj: pageMetricsArr[i],
        opt,
      });
      // Browser case
    } else {
      res = await gs.scheduler.evalPageFont({
        font: font.normal.family,
        page: pageArr[i],
        binaryImage: imageI,
        pageMetricsObj: pageMetricsArr[i],
        opt,
      });
    }

    metricTotal += res.metricTotal;
    wordsTotal += res.wordsTotal;
  }

  return { wordsTotal, metricTotal };
}

/**
* @param {Array<OcrPage>} pageArr
* @param {boolean} opt - Whether to use optimized fonts.
*/
export async function evaluateFonts(pageArr, opt) {
  const fontActive = fontAll.getContainer('active');

  const debug = false;

  // The browser version runs in parallel using workers, however the Node.js version runs sequentially,
  // as the canvas package does not support workers, and trying to run in parallel causes problems.
  // The logic is the same in both versions.
  let sansMetrics;
  let serifMetrics;
  if (typeof process === 'undefined') {
    const fontMetricsPromises = {
      carlito: evalPagesFont(fontActive.Carlito, pageArr, opt),
      nimbusSans: evalPagesFont(fontActive.NimbusSans, pageArr, opt),
      century: evalPagesFont(fontActive.Century, pageArr, opt),
      palatino: evalPagesFont(fontActive.Palatino, pageArr, opt),
      garamond: evalPagesFont(fontActive.Garamond, pageArr, opt),
      nimbusRomNo9L: evalPagesFont(fontActive.NimbusRomNo9L, pageArr, opt),
    };

    const fontMetrics = {
      carlito: await fontMetricsPromises.carlito,
      nimbusSans: await fontMetricsPromises.nimbusSans,
      century: await fontMetricsPromises.century,
      palatino: await fontMetricsPromises.palatino,
      garamond: await fontMetricsPromises.garamond,
      nimbusRomNo9L: await fontMetricsPromises.nimbusRomNo9L,
    };

    sansMetrics = {
      Carlito: fontMetrics.carlito.metricTotal / fontMetrics.carlito.wordsTotal,
      NimbusSans: fontMetrics.nimbusSans.metricTotal / fontMetrics.nimbusSans.wordsTotal,
    };

    serifMetrics = {
      Century: fontMetrics.century.metricTotal / fontMetrics.century.wordsTotal,
      Palatino: fontMetrics.palatino.metricTotal / fontMetrics.palatino.wordsTotal,
      Garamond: fontMetrics.garamond.metricTotal / fontMetrics.garamond.wordsTotal,
      NimbusRomNo9L: fontMetrics.nimbusRomNo9L.metricTotal / fontMetrics.nimbusRomNo9L.wordsTotal,
    };
  } else {
    const fontMetrics = {
      Carlito: await evalPagesFont(fontActive.Carlito, pageArr, opt),
      NimbusSans: await evalPagesFont(fontActive.NimbusSans, pageArr, opt),
      Century: await evalPagesFont(fontActive.Century, pageArr, opt),
      Palatino: await evalPagesFont(fontActive.Palatino, pageArr, opt),
      Garamond: await evalPagesFont(fontActive.Garamond, pageArr, opt),
      NimbusRomNo9L: await evalPagesFont(fontActive.NimbusRomNo9L, pageArr, opt),
    };

    sansMetrics = {
      Carlito: fontMetrics.Carlito.metricTotal / fontMetrics.Carlito.wordsTotal,
      NimbusSans: fontMetrics.NimbusSans.metricTotal / fontMetrics.NimbusSans.wordsTotal,
    };

    serifMetrics = {
      Century: fontMetrics.Century.metricTotal / fontMetrics.Century.wordsTotal,
      Palatino: fontMetrics.Palatino.metricTotal / fontMetrics.Palatino.wordsTotal,
      Garamond: fontMetrics.Garamond.metricTotal / fontMetrics.Garamond.wordsTotal,
      NimbusRomNo9L: fontMetrics.NimbusRomNo9L.metricTotal / fontMetrics.NimbusRomNo9L.wordsTotal,
    };
  }

  let minKeySans = 'NimbusSans';
  let minValueSans = Number.MAX_VALUE;

  for (const [key, value] of Object.entries(sansMetrics)) {
    if (debug) console.log(`${key} metric: ${String(value)}`);
    if (value < minValueSans) {
      minValueSans = value;
      minKeySans = key;
    }
  }

  let minKeySerif = 'NimbusRomNo9L';
  let minValueSerif = Number.MAX_VALUE;

  for (const [key, value] of Object.entries(serifMetrics)) {
    if (debug) console.log(`${key} metric: ${String(value)}`);
    if (value < minValueSerif) {
      minValueSerif = value;
      minKeySerif = key;
    }
  }

  return {
    sansMetrics,
    serifMetrics,
    minKeySans,
    minKeySerif,
  };
}

/**
 * Runs font optimization and validation. Sets `fontAll` defaults to best fonts,
 * and returns `true` if sans or serif could be improved through optimization.
 *
 * @param {Array<OcrPage>} ocrArr - Array of OCR pages to use for font optimization.
 *
 * This function should still be run, even if no character-level OCR data is present,
 * as it is responsible for picking the correct default sans/serif font.
 * The only case where this function does nothing is when (1) there is no character-level OCR data
 * and (2) no images are provided to compare against.
 */
export async function runFontOptimization(ocrArr) {
  await loadBuiltInFontsRaw();

  const fontRaw = fontAll.getContainer('raw');

  const calculateOpt = fontMetricsObj && Object.keys(fontMetricsObj).length > 0;

  let enableOptSerif = false;
  let enableOptSans = false;

  let optimizeFontContainerAllPromise;
  if (calculateOpt) {
    setDefaultFontAuto(fontMetricsObj);

    optimizeFontContainerAllPromise = optimizeFontContainerAll(fontRaw, fontMetricsObj)
      .then((res) => {
        fontAll.optInitial = res;

        // If no image data exists, then `opt` is set to `optInitial`.
        // This behavior exists so that data can be loaded from previous sessions without changing the appearance of the document.
        // Arguably, in cases where a user uploads raw OCR data and no images, using the raw font is more prudent than an unvalidated optimized font.
        // If this ever comes up in actual usage and is a problem, then the behavior can be changed for that specific case.
        if (!ImageCache.inputModes.image && !ImageCache.inputModes.pdf) {
          fontAll.opt = { ...fontAll.optInitial };
        }
      });
  }

  // If image data exists, select the correct font by comparing to the image.
  if (ImageCache.inputModes.image || ImageCache.inputModes.pdf) {
    // Evaluate default fonts using up to 5 pages.
    const pageNum = Math.min(ImageCache.pageCount, 5);

    // This step needs to happen here as all fonts must be registered before initializing the canvas.
    if (!(typeof process === 'undefined')) {
      await optimizeFontContainerAllPromise;
      const { initCanvasNode } = await import('./worker/compareOCRModule.js');
      await initCanvasNode();
    }

    const evalRaw = await evaluateFonts(ocrArr.slice(0, pageNum), false);
    DebugData.evalRaw = evalRaw;

    await optimizeFontContainerAllPromise;
    if (calculateOpt && Object.keys(fontAll.optInitial).length > 0) {
      // Enable optimized fonts
      await enableFontOpt(true, true, true);

      const evalOpt = await evaluateFonts(ocrArr.slice(0, pageNum), true);
      DebugData.evalOpt = evalOpt;

      // The default font for both the optimized and unoptimized versions are set to the same font.
      // This ensures that switching on/off "font optimization" does not change the font, which would be confusing.
      if (evalOpt.sansMetrics[evalOpt.minKeySans] < evalRaw.sansMetrics[evalRaw.minKeySans]) {
        fontAll.sansDefaultName = evalOpt.minKeySans;
        enableOptSans = true;
      } else {
        fontAll.sansDefaultName = evalRaw.minKeySans;
      }

      // Repeat for serif fonts
      if (evalOpt.serifMetrics[evalOpt.minKeySerif] < evalRaw.serifMetrics[evalRaw.minKeySerif]) {
        fontAll.serifDefaultName = evalOpt.minKeySerif;
        enableOptSerif = true;
      } else {
        fontAll.serifDefaultName = evalRaw.minKeySerif;
      }

      // Create final optimized font object.
      // The final optimized font is set to either the initial optimized font or the raw font depending on what fits better.
      // Make shallow copy to allow for changing individual fonts without copying the entire object.
      fontAll.opt = { ...fontAll.optInitial };

      if (!enableOptSans) {
        fontAll.opt.Carlito = fontRaw.Carlito;
        fontAll.opt.NimbusSans = fontRaw.NimbusSans;
      }

      if (!enableOptSerif) {
        fontAll.opt.Century = fontRaw.Century;
        fontAll.opt.Garamond = fontRaw.Garamond;
        fontAll.opt.NimbusRomNo9L = fontRaw.NimbusRomNo9L;
        fontAll.opt.Palatino = fontRaw.Palatino;
      }
    } else {
      fontAll.sansDefaultName = evalRaw.minKeySans;
      fontAll.serifDefaultName = evalRaw.minKeySerif;
    }
  }

  // Set final fonts in workers
  await enableFontOpt(true, false, true);

  const enableOpt = enableOptSerif || enableOptSans;

  return enableOpt;
}
