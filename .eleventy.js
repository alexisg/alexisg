// const inclusiveLangPlugin = require('@11ty/eleventy-plugin-inclusive-language')
const filters = require('./utils/filters.js')
const postcss = require("postcss");
const cssnano = require("cssnano");
const eleventySass = require("eleventy-sass");

module.exports = function (config) {
    // // Plugins
    // config.addPlugin(inclusiveLangPlugin);
    config.addPlugin(eleventySass, {
        postcss: postcss([cssnano])
      });

    // Filters
    Object.keys(filters).forEach((filterName) => {
        config.addFilter(filterName, filters[filterName])
    })

    // // Asset Watch Targets
    config.addWatchTarget('./src/sass')

    // Layouts
    config.addLayoutAlias('base', 'base.njk')
    config.addLayoutAlias('post', 'portfolio.njk')

    // Pass-through files
    config.addPassthroughCopy('src/static/images')
    config.addPassthroughCopy('src/static/media')
    config.addPassthroughCopy('src/static/webfonts')
    config.addPassthroughCopy('src/static/css')
    config.addPassthroughCopy('src/static/js')
    config.addPassthroughCopy('src/static/api')

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
    }
}
