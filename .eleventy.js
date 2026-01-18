const sass = require('sass');
const path = require('path');
const postcss = require('postcss');
const cssnano = require('cssnano');
const filters = require('./utils/filters.js');

module.exports = function (config) {
    // Handle Sass files
    config.addTemplateFormats("sass");
    config.addTemplateFormats("scss");
    
    // Track dependencies for SASS/SCSS files
    let sassDependencies = new Map();
    
    const compileSass = async (inputPath, inputContent) => {
        let result = sass.compile(inputPath, {
            loadPaths: [
                path.dirname(inputPath),
                "node_modules"
            ],
            style: "compressed"
        });
        
        // Store dependencies for this file
        sassDependencies.set(inputPath, result.loadedUrls.map(url => url.pathname));
        
        // Process with PostCSS
        const postCssResult = await postcss([cssnano]).process(result.css, { from: undefined });
        return postCssResult.css;
    };
    
    config.addExtension("sass", {
        outputFileExtension: "css",
        compile: async function(inputContent, inputPath) {
            // Always compile non-partial files
            if (!path.basename(inputPath).startsWith("_")) {
                return async () => await compileSass(inputPath, inputContent);
            }
            
            // For partials, invalidate any files that depend on this partial
            for (const [mainFile, deps] of sassDependencies.entries()) {
                if (deps.includes(inputPath)) {
                    // Force 11ty to recompile the main file
                    config.addDependency(mainFile, inputPath);
                }
            }
        }
    });

    config.addExtension("scss", {
        outputFileExtension: "css",
        compile: async function(inputContent, inputPath) {
            // Always compile non-partial files
            if (!path.basename(inputPath).startsWith("_")) {
                return async () => await compileSass(inputPath, inputContent);
            }
            
            // For partials, invalidate any files that depend on this partial
            for (const [mainFile, deps] of sassDependencies.entries()) {
                if (deps.includes(inputPath)) {
                    // Force 11ty to recompile the main file
                    config.addDependency(mainFile, inputPath);
                }
            }
        }
    });

    // Filters
    Object.keys(filters).forEach((filterName) => {
        config.addFilter(filterName, filters[filterName])
    });

    // Asset Watch Targets
    config.addWatchTarget('./src/sass/');
    config.addWatchTarget('./src/sass/**/*.sass');
    config.addWatchTarget('./src/sass/**/*.scss');

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
    config.addPassthroughCopy('src/Alexis-Gallisa-resume-2026.pdf');
    
    // Ignore README files in static directories
    config.ignores.add('src/static/js/README.md');

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
