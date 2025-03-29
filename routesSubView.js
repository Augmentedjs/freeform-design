const   Augmented = require("augmentedjs");
	    Augmented.Presentation = require("augmentedjs-presentation"),
        Handlebars = require("handlebars");
const CONSTANTS = require("./constants.js"),
  app = require("./application.js"),
  Models = require("./models.js"),
  EditDialog = require("./editDialog.js");
// ,
//         routesTemplate = require("./templates/routesTemplate.js");

var RouteCollection = Augmented.Collection.extend({
    model: Models.RouteModel
});

// dialogs

var EditRouteDialog = EditDialog.extend({
    style: "bigForm",
    title: "Edit Route",
    name: "edit-route"
});

var supportedRoutes = [
    "function", "view", "controller"
];

// an option builder for the routes
var buildOptions = function(selected) {
    var html = "", i = 0, l = supportedRoutes.length;
    for (i = 0; i < l; i++) {
        html = html + "<option";
        if (supportedRoutes[i] === selected) {
            html = html + " selected";
        }
        html = html + ">" + supportedRoutes[i] + "</option>";
    }
    return html;
};

// RoutesView
module.exports = Augmented.Presentation.DecoratorView.extend({
    name: CONSTANTS.NAMES_AND_QUEUES.ROUTES,
    el: CONSTANTS.VIEW_MOUNT.ROUTES,
    init: function() {
        this.collection = new RouteCollection();
        var arr = app.getDatastoreItem("routes");
        if (arr) {
            this.collection.reset(arr);
        }
        this.render();
    },
    render: function() {
        // refresh the data
        app.setDatastoreItem("routes", this.collection.toJSON());
        var e = this.boundElement("currentRoutes");
        this.removeTemplate(e, true);
        this.injectTemplate(Handlebars.templates.routesTemplate({"currentRoutes": this.collection.toJSON()}), e);
    },
    editRoute: function(event) {
        var index = (event.currentTarget.getAttribute("data-index"));
        var model = this.collection.at(index);
        this.openDialog(model, index);
    },
    saveRoute: function() {
        var r = this.dialog.model.get("edit-route-x");
        if (r) {
            var c = this.dialog.model.get("edit-callback-x");
            var type = this.dialog.model.get("edit-type-x");
            var index = this.dialog.model.get("index");
            var model = this.collection.at(index);

            if (model && index != -1) {
                model.set("route", r);
                model.set("callback", c);
                model.set("type", type);
                this.collection.push(model);
            } else {
                model = new Models.RouteModel({"route": r, "callback": c, "type": type});
                this.collection.add(model);
            }
            this.render();
        }
    },
    deleteRoute: function() {
        var index = this.dialog.model.get("index");
        var model = this.collection.at(index);
        this.collection.remove(model);
        this.render();
    },
    currentRoutes: function(event) {
        var index = (event.target.getAttribute("data-index"));
        var a = this.model.get("currentRoutes");
        this.openDialog(a, index);
    },
    openDialog: function(model, index) {
        if (!this.dialog) {
            this.dialog = new EditRouteDialog();
            this.listenTo(this.dialog, "save", this.saveRoute);
            this.listenTo(this.dialog, "delete", this.deleteRoute);
            this.listenTo(this.dialog, "close", this.closeDialog);
        }

        if (!model) {
            model = new Models.RouteModel();
        }

        if (index === -1) {
            this.dialog.title = "Add New Route";
            this.dialog.buttons = {
                "cancel": "cancel",
                "ok" : "ok"
            };
        } else {
            this.dialog.title = "Edit Route";
            this.dialog.buttons = {
                "cancel": "cancel",
                "ok" : "ok",
                "delete": "del"
            };
        }

        this.dialog.model.set("index", index);
        var body =
            "<label for=\"edit-route\">Route</label>" +
            "<input type=\"text\" name=\"edit-route\" data-edit-route=\"edit-route-x\" value=\"" + model.get("route") + "\" placeholder=\"Route\" />" +
            "<label for=\"edit-callback\">Callback</label>" +
            "<input type=\"text\" name=\"edit-callback\" data-edit-route=\"edit-callback-x\"" +
                "value=\"" + model.get("callback") + "\" placeholder=\"Callback Function\"/>" +
            "<label for=\"edit-type\">Type</label>" +
            "<select name=\"edit-type\" data-edit-route=\"edit-type-x\">";
        // mark selected
        body = body + buildOptions(model.get("type")) + "</select>";

        this.dialog.body = body;
        this.dialog.render();
        this.dialog.syncBoundElement("edit-route-x");
        this.dialog.syncBoundElement("edit-callback-x");
        this.dialog.syncBoundElement("edit-type-x");
    },
    closeDialog: function() {
    },
    addRoute: function() {
        this.openDialog(null, -1);
    },
    remove: function() {
        if (this.dialog) {
            this.dialog.remove();
        }
        /* off to unbind the events */
        this.off();
        this.stopListening();
        return this;
    }
});
