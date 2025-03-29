const   Augmented = require("augmentedjs");
	    Augmented.Presentation = require("augmentedjs-presentation");
const CONSTANTS = require("./constants.js"),
  app = require("./application.js");
// ,
// 		overviewTemplate = require("./templates/overviewTemplate.js");

//OverviewView
module.exports = Augmented.Presentation.DecoratorView.extend({
    name: CONSTANTS.NAMES_AND_QUEUES.OVERVIEW,
    el: CONSTANTS.VIEW_MOUNT.OVERVIEW,
    init: function() {
		this.render();
    },
    render: function() {
        var e = this.boundElement("overviewDetail");
        this.removeTemplate(e, true);
        var ds = app.getDatastore();
        this.injectTemplate(Handlebars.templates.overviewTemplate(ds.toJSON()), e);
    }
});
