const sass = require('sass');
const path = require('path');
const postcss = require('postcss');
const cssnano = require('cssnano');
const filters = require('./utils/filters.js');

module.exports = function (config) {
    // Handle Sass files
    config.addTemplateFormats("sass");
    config.addTemplateFormats("scss");
    
    config.addExtension("sass", {
        outputFileExtension: "css",
        compile: async function(inputContent, inputPath) {
            if (path.basename(inputPath).startsWith("_")) {
                return;
            }
            
            let result = sass.compileString(inputContent, {
                loadPaths: [
                    path.dirname(inputPath),
                    "node_modules"
                ],
                style: "compressed"
            });
            
            // Process with PostCSS
            const postCssResult = await postcss([cssnano]).process(result.css, { from: undefined });
            
            return async () => postCssResult.css;
        }
    });

    config.addExtension("scss", {
        outputFileExtension: "css",
        compile: async function(inputContent, inputPath) {
            if (path.basename(inputPath).startsWith("_")) {
                return;
            }
            
            let result = sass.compileString(inputContent, {
                loadPaths: [
                    path.dirname(inputPath),
                    "node_modules"
                ],
                style: "compressed"
            });
            
            // Process with PostCSS
            const postCssResult = await postcss([cssnano]).process(result.css, { from: undefined });
            
            return async () => postCssResult.css;
        }
    });

    // Filters
    Object.keys(filters).forEach((filterName) => {
        config.addFilter(filterName, filters[filterName])
    });

    // Asset Watch Targets
    config.addWatchTarget('./src/sass');

    // Layouts
    config.addLayoutAlias('base', 'base.njk');
    config.addLayoutAlias('post', 'portfolio.njk');

    // Pass-through files
    config.addPassthroughCopy('src/static/images');
    config.addPassthroughCopy('src/static/media');
    config.addPassthroughCopy('src/static/webfonts');
    config.addPassthroughCopy('src/static/css');
    config.addPassthroughCopy('src/static/js');
    config.addPassthroughCopy('src/static/api');

    // Base Config
    return {
        dir: {
            input: 'src',
            output: 'dist',
            includes: 'includes',
            layouts: 'layouts',
            data: 'data'
        },
        templateFormats: ['njk', 'md', '11ty.js'],
        htmlTemplateEngine: 'njk',
        markdownTemplateEngine: 'njk'
    };
};
