// Main project module
define("mainProject", ["augmented", "augmentedPresentation", "application", "models", "editDialog", "handlebars",
// subviews
"stylesheetsSubView", "routesSubView", "controllersSubView", "viewsSubView", "modelsSubView", "schemasSubView", "overviewSubView"],
    function(Augmented, Presentation, app, Models, EditDialog, Handlebars,
        StylesheetsView, RoutesView, ControllersView, ViewsView, ModelsView, SchemasView, OverviewView) {
    "use strict";

    var ProjectSideNavigation = Augmented.Presentation.DecoratorView.extend({
        name: "sideNav",
        el: "#sideNav",
        currentNav: "",
        init: function() {
            this.syncModelChange("name");
            this.model.set("name", app.datastore.get("project"));
            this.on("markNavigation", function(nav) {
                this.markNavigation(nav);
            });
        },
        defaultNavigation: function() {
            this.overview();
        },
        markNavigation: function(nav) {
            Augmented.Presentation.Dom.removeClass(this.currentNav, "current");
            var navListEl = this.boundElement(nav);
            this.currentNav = navListEl;
            Augmented.Presentation.Dom.addClass(this.currentNav, "current");
        },
        overview: function() {
            this.sendMessage("navigation", "overview");
        },
        stylesheets: function() {
            this.sendMessage("navigation", "stylesheets");
        },
        routes: function() {
            this.sendMessage("navigation", "routes");
        },
        views: function() {
            this.sendMessage("navigation", "views");
        },
        controllers: function() {
            this.sendMessage("navigation", "controllers");
        },
        models: function() {
            this.sendMessage("navigation", "models");
        },
        schemas: function() {
            this.sendMessage("navigation", "schemas");
        }
    });

    var MainProjectMediator = Augmented.Presentation.Mediator.extend({
        name:"projectMediator",
        el: "#activePanel",
        basePanelEl: "#basePanel",
        currentNavigation: "",
        currentNavigationView: null,
        init: function() {
            this.on("navigation", function(navigation) {
                if (navigation === "stylesheets" && this.currentNavigation !== navigation) {
                    this.doNavigation(navigation, StylesheetsView);
                } else if (navigation === "routes" && this.currentNavigation !== navigation) {
                    this.doNavigation(navigation, RoutesView);
                } else if (navigation === "views" && this.currentNavigation !== navigation) {
                    this.doNavigation(navigation, ViewsView);
                } else if (navigation === "controllers" && this.currentNavigation !== navigation) {
                    this.doNavigation(navigation, ControllersView);
                } else if (navigation === "models" && this.currentNavigation !== navigation) {
                    this.doNavigation(navigation, ModelsView);
                } else if (navigation === "schemas" && this.currentNavigation !== navigation) {
                    this.doNavigation(navigation, SchemasView);
                } else if (navigation === "overview" && this.currentNavigation !== navigation) {
                    this.doNavigation(navigation, OverviewView);
                }
            });
            this.setViewportHeight();
        },
        setViewportHeight: function() {
            var header = Augmented.Presentation.Dom.selector("#header").offsetHeight;
            this.el.style.height = (Augmented.Presentation.Dom.getViewportHeight() - ((header) ? (header) : 55)) + "px";
        },
        doNavigation: function(navigation, ViewObject) {
            this.removeLastView();
            this.currentNavigation = navigation;
            this.publish("sideNav", "markNavigation", navigation);

            app.log("adding view");

            var el = Augmented.Presentation.Dom.selector(this.basePanelEl);
            Augmented.Presentation.Dom.empty(el);
            Augmented.Presentation.Dom.injectTemplate("#" + navigation + "Template", el);
            this.currentNavigationView = new ViewObject();
            this.observeColleagueAndTrigger(
                this.currentNavigationView, // colleague view
                "myColleague",   // channel
                "myColleague"    // identifier
            );
            this.setViewportHeight();
        },
        removeLastView: function() {
            if (this.currentNavigationView) {
                app.log("removing last view");
                this.dismissColleagueTrigger(this.currentNavigationView, "myColleague", "myColleague");
                this.currentNavigationView.remove();
            }
            this.currentNavigation = null;
        },
        render: function() {
            Augmented.Presentation.Dom.injectTemplate("#mainProjectTemplate", this.el);
            this.sideNav = new ProjectSideNavigation();
            this.observeColleagueAndTrigger(
                this.sideNav, // colleague view
                "sideNav",   // channel
                "sideNav"    // identifier
            );
            // setup default nav
            this.sideNav.defaultNavigation();
        },
        remove: function() {
            if (this.sideNav) {
                this.sideNav.remove();
            }
            if (this.currentNavigationView) {
                this.currentNavigationView.remove();
            }
            /* off to unbind the events */
            this.off();
            this.stopListening();
            Augmented.Presentation.Dom.empty(this.el);
            return this;
        }
    });

    // The controller for Main

    var MainProjectController = Augmented.Presentation.ViewController.extend({
        render: function() {
            this.projectMediator.render();
        },
        initialize: function() {
            this.projectMediator = new MainProjectMediator();
            return this;
        },
        remove: function() {
            this.projectMediator.remove();
            this.projectMediator = null;
        }
    });
    return new MainProjectController();
});
