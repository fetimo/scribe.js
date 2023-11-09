// Script for generating small caps fonts from standard fonts.
// This is used to generate all "small caps" variants used in ScribeOCR. 
// Example use: node node/createSmallCapsFont.js fonts/Lato-Regular.woff fonts/Lato-SmallCaps.woff

import { createRequire } from "module";

globalThis.require = createRequire(import.meta.url);

globalThis.self = globalThis;
await import('../lib/opentype.js');

const args = process.argv.slice(2);

// Note: Small caps are treated differently from Bold and Italic styles.
// Browsers will "fake" small caps using smaller versions of large caps.
// Unfortunately, it looks like small caps cannot be loaded as a FontFace referring
// to the same font family.  Therefore, they are instead loaded to a different font family.
// https://stackoverflow.com/questions/14527408/defining-small-caps-font-variant-with-font-face
async function createSmallCapsFont(fontData, heightSmallCaps) {

    let workingFont;
    if (typeof (fontData) == "string") {
        workingFont = await opentype.load(fontData);
    } else {
        workingFont = opentype.parse(fontData, { lowMemory: false });
    }

    let oGlyph = workingFont.charToGlyph("o");
    let oGlyphMetrics = oGlyph.getMetrics();
    let xHeight = oGlyphMetrics.yMax - oGlyphMetrics.yMin;
    let fontAscHeight = workingFont.charToGlyph("A").getMetrics().yMax;
    const smallCapsMult = xHeight * (heightSmallCaps ?? 1) / fontAscHeight;
    const lower = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
    const singleStemClassA = ["i", "l", "t", "I"];
    const singleStemClassB = ["f", "i", "j", "l", "t", "I", "J", "T"];

    for (let i = 0; i < lower.length; i++) {
        const charLit = lower[i];
        const glyphIUpper = workingFont.charToGlyph(charLit.toUpperCase());
        const glyphI = workingFont.charToGlyph(charLit);

        glyphI.path.commands = JSON.parse(JSON.stringify(glyphIUpper.path.commands));

        for (let j = 0; j < glyphI.path.commands.length; j++) {
            let pointJ = glyphI.path.commands[j];
            if (pointJ.x != null) {
                pointJ.x = Math.round(pointJ.x * (smallCapsMult));
            }
            if (pointJ.x1 != null) {
                pointJ.x1 = Math.round(pointJ.x1 * (smallCapsMult));
            }
            if (pointJ.x2 != null) {
                pointJ.x2 = Math.round(pointJ.x2 * (smallCapsMult));
            }

            if (pointJ.y != null) {
                pointJ.y = Math.round(pointJ.y * (smallCapsMult));
            }
            if (pointJ.y1 != null) {
                pointJ.y1 = Math.round(pointJ.y1 * (smallCapsMult));
            }
            if (pointJ.y2 != null) {
                pointJ.y2 = Math.round(pointJ.y2 * (smallCapsMult));
            }

        }

        glyphI.advanceWidth = Math.round(glyphIUpper.advanceWidth * smallCapsMult);

    }

    // Remove ligatures, as these are especially problematic for small caps fonts (as small caps may be replaced by lower case ligatures)
    workingFont.tables.gsub = null;

    return workingFont;

}

const smallCapsFont = await createSmallCapsFont(args[0]);

smallCapsFont.download(args[1]);