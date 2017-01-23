const Augmented = require("augmentedjs");
	  Augmented.Presentation = require("augmentedjs-presentation");
const CONSTANTS = require("./constants.js"),
        app = require("./application.js");

module.exports = Augmented.Presentation.Mediator.extend({
    el: CONSTANTS.VIEW_MOUNT.ACTIVE_PANEL,
    remove: function() {
        /* off to unbind the events */
        this.off(this.el);
        this.stopListening();
        Augmented.Presentation.Dom.empty(this.el);
        return this;
    },
    goToProject: function() {
        this.currentView = null;
		app.clearCurrentView();
        //app.datastore.unset("currentView");
		app.navigate(CONSTANTS.NAVIGATION.PROJECT);
        //app.router.navigate(CONSTANTS.NAVIGATION.PROJECT, {trigger: true});
    },
    saveData: function() {
		app.setCurrentView(this.currentView);
        //app.datastore.set("currentView", this.currentView);
        var views = app.getViews();
		//app.datastore.get("views");
        if (views) {
            views[this.currentView.index] = this.currentView.model;
        }
    }
});
