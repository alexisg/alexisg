// const pluginRss = require('@11ty/eleventy-plugin-rss')
// const pluginNavigation = require('@11ty/eleventy-navigation')
// const markdownIt = require('markdown-it')

// const filters = require('./utils/filters.js')
// const transforms = require('./utils/transforms.js')
// const shortcodes = require('./utils/shortcodes.js')
// const iconsprite = require('./utils/iconsprite.js')

module.exports = function (config) {
    // // Plugins
    // config.addPlugin(pluginRss)
    //config.addPlugin(pluginNavigation)

    // // Filters
    // Object.keys(filters).forEach((filterName) => {
    //     config.addFilter(filterName, filters[filterName])
    // })

    // // Transforms
    // Object.keys(transforms).forEach((transformName) => {
    //     config.addTransform(transformName, transforms[transformName])
    // })

    // // Shortcodes
    // Object.keys(shortcodes).forEach((shortcodeName) => {
    //     config.addShortcode(shortcodeName, shortcodes[shortcodeName])
    // })

    // // Icon Sprite
    // config.addNunjucksAsyncShortcode('iconsprite', iconsprite)

    // // Asset Watch Targets
    // config.addWatchTarget('./src/static')

    // // Markdown
    // config.setLibrary(
    //     'md',
    //     markdownIt({
    //         html: true,
    //         breaks: true,
    //         linkify: true,
    //         typographer: true
    //     })
    // )

    // Layouts
    config.addLayoutAlias('base', 'base.njk')
    config.addLayoutAlias('post', 'portfolio.njk')

    // Pass-through files
    config.addPassthroughCopy('src/static/images')
    config.addPassthroughCopy('src/static/media')
    config.addPassthroughCopy('src/static/webfonts')
    config.addPassthroughCopy('src/static/css')
    config.addPassthroughCopy('src/static/js')


    // Deep-Merge
    // config.setDataDeepMerge(true)

    // Base Config
    return {
        dir: {
            input: 'src',
            output: 'dist',
            includes: 'includes',
            layouts: 'layouts'
            // data: 'data'
        },
        templateFormats: ['njk', 'md', '11ty.js'],
        htmlTemplateEngine: 'njk',
        markdownTemplateEngine: 'njk'
    }
}
