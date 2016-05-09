({
    baseUrl: ".",
    paths: {
        backbone: "../lib/backbone-min",
        underscore: "../lib/lodash.min",
        jquery: "../lib/jquery.min",
        handlebars: "../lib/handlebars",
        jszip: "../lib/jszip.min",
        filesaver: "../lib/FileSaver.min",
        augmented: "../lib/augmented",
        augmentedPresentation: "../lib/augmentedPresentation",
        routesTemplate: "templates/routesTemplate",
        stylesheetsTemplate: "templates/stylesheetsTemplate",
        viewsTemplate: "templates/viewsTemplate",
	    permissionsTemplate: "templates/permissionsTemplate",
        controllersTemplate: "templates/controllersTemplate"
    },
    include: ["jszip", "filesaver"],
    name: "freeform-designRequire",
    out: "freeform-designRequire-built.js",
    optimize: "uglify2",
    preserveLicenseComments: false,
    generateSourceMaps: true,
    useStrict: true
})