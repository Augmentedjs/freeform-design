const   Augmented = require("augmentedjs");
	    Augmented.Presentation = require("augmentedjs-presentation"),
        Handlebars = require("handlebars");
const CONSTANTS = require("./constants.js"),
  app = require("./application.js"),
  Models = require("./models.js"),
  EditDialog = require("./editDialog.js"),
  AbstractEditorView = require("./abstractEditorView.js");
// ,
//         viewsTemplate = require("./templates/viewsTemplate.js"),
//         logger = require("./logger.js");

var ViewCollection = Augmented.Collection.extend({
    model: Models.ViewModel
});

// dialogs

var EditViewDialog = EditDialog.extend({
    style: "bigForm",
    title: "Edit View",
    name: "edit-view"
});

// Current supported views
var SUPPORTED_VIEWS = [ "View", "Mediator", "Colleague", "AutomaticTable", "AutomaticForm", "DecoratorView", "DialogView" ];

// register panels to a view type for navigation
var panelRegistry = {
    "View":         	CONSTANTS.NAVIGATION.VIEW,
    "Mediator":     	CONSTANTS.NAVIGATION.MEDIATOR,
    "Colleague":    	CONSTANTS.NAVIGATION.VIEW,
    "DecoratorView":    CONSTANTS.NAVIGATION.VIEW,
    "DialogView":       CONSTANTS.NAVIGATION.DIALOG,
    "AutomaticTable":   CONSTANTS.NAVIGATION.TABLE,
    "AutomaticForm":    CONSTANTS.NAVIGATION.FORM
};

// an option builder for the views
var buildOptions = function(selected) {
    var html = "", i = 0, l = SUPPORTED_VIEWS.length;
    for (i = 0; i < l; i++) {
        html = html + "<option";
        if (SUPPORTED_VIEWS[i] === selected) {
            html = html + " selected";
        }
        html = html + ">" + SUPPORTED_VIEWS[i] + "</option>";
    }
    return html;
};

var buildModelOptions = function(selected) {
    var html = "", i = 0, m = app.getDatastoreItem("models"), l = m.length;
    html = html + "<option";
    if (!selected) {
        html = html + " selected";
    }
    html = html + ">No Model</option>";

    for (i = 0; i < l; i++) {
        html = html + "<option";
        if (m[i].name === selected) {
            html = html + " selected";
        }
        html = html + ">" + m[i].name + "</option>";
    }
    return html;
};

// {{#compare unicorns ponies operator="<"}}
Handlebars.registerHelper("compare", function(lvalue, rvalue, options) {
    if (arguments.length < 3)
        throw new Error("Handlerbars Helper \"compare\" needs 2 parameters");
    var operator = options.hash.operator || "==";
    var operators = {
        "==":       function(l,r) { return l == r; },
        "===":      function(l,r) { return l === r; },
        "!=":       function(l,r) { return l != r; },
        "<":        function(l,r) { return l < r; },
        ">":        function(l,r) { return l > r; },
        "<=":       function(l,r) { return l <= r; },
        ">=":       function(l,r) { return l >= r; },
        "typeof":   function(l,r) { return typeof l == r; }
    };
    if (!operators[operator])
        throw new Error("Handlerbars Helper \"compare\" doesn't know the operator "+operator);
    var result = operators[operator](lvalue,rvalue);
    if( result ) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});

// ViewsView
module.exports = AbstractEditorView.extend({
    name: CONSTANTS.NAMES_AND_QUEUES.VIEWS,
    el: CONSTANTS.VIEW_MOUNT.VIEWS,
    init: function() {
        this.collection = new ViewCollection();
        var arr = app.getDatastoreItem("views");
        if (arr) {
            this.collection.reset(arr);
        }
        this.render();
    },
    render: function() {
        // refresh the data
        app.setDatastoreItem("views", this.collection.toJSON());
        var e = this.boundElement("currentViews");
        this.removeTemplate(e, true);
        this.injectTemplate(Handlebars.templates.viewsTemplate({"currentViews": this.collection.toJSON()}), e);
    },
    editView: function(event) {
        this.editCurrent(event);
    },
    editViewType: function(event) {
        var index = (event.currentTarget.getAttribute("data-index"));
        var model = this.collection.at(index);
        var panel = panelRegistry[model.get("type")];
        app.setCurrentView({ "index": index, "model": model.toJSON() });
        app.navigate(panel);
    },
    editViewPermissions: function(event) {
        var index = (event.currentTarget.getAttribute("data-index"));
        var model = this.collection.at(index);
        var panel = panelRegistry.View;
        app.setCurrentView({ "index": index, "model": model.toJSON() });
        app.navigate(panel);
    },
    saveView: function() {
        var name = this.dialog.model.get("edit-view");
        if (name) {
            var type = this.dialog.model.get("edit-view-type");
            var index = this.dialog.model.get("index");
            var m = this.dialog.model.get("edit-view-model");
            var model = this.collection.at(index);

            if (model && index != -1) {
                model.set("name", name);
                model.set("type", type);
                model.set("model", m);
                this.collection.push(model);
            } else {
                model = new Models.ViewModel({"name": name, "type": type, "model": m});
                this.collection.add(model);
            }

            this.render();
        }
    },
    deleteView: function() {
        this.deleteCurrent();
    },
    currentViews: function(event) {
        var index = (event.target.getAttribute("data-index"));
        var a = this.model.get("currentViews");
        this.openDialog(a, index);
    },
    openDialog: function(model, index) {
        if (!this.dialog) {
            this.dialog = new EditViewDialog();
            this.listenTo(this.dialog, CONSTANTS.MESSAGES.SAVE, this.saveView);
            this.listenTo(this.dialog, CONSTANTS.MESSAGES.DELETE, this.deleteView);
            this.listenTo(this.dialog, CONSTANTS.MESSAGES.CLOSE, this.closeDialog);
        }

        if (!model) {
            model = new Models.ViewModel();
        }

        if (index === -1) {
            this.dialog.title = "Add New View";
            this.dialog.buttons = {
                "cancel": "cancel",
                "ok" : "ok"
            };
        } else {
            this.dialog.title = "Edit View";
            this.dialog.buttons = {
                "cancel": "cancel",
                "ok" : "ok",
                "delete": "del"
            };
        }

        this.dialog.model.set("index", index);
        this.dialog.body =
            "<label for=\"edit-view-name\">View</label>" +
            "<input type=\"text\" value=\"" + ((model) ? model.get("name") : "") +
                "\" data-edit-view=\"edit-view\" name=\"edit-view-name\" placeholder=\"Name\" required/>" +
            "<label for=\"edit-view-type\">Type (Class)</label>" +
            "<select data-edit-view=\"edit-view-type\" name=\"edit-view-type\">" +
                buildOptions(model.get("type")) + "</select>" +
            "<label for=\"edit-view-model\">Model</label>" +
            "<select data-edit-view=\"edit-view-model\" name=\"edit-view-model\">" +
                buildModelOptions(model.get("model")) + "</select>";
        this.dialog.render();
        this.dialog.syncBoundElement("edit-view");
        this.dialog.syncBoundElement("edit-view-type");
        this.dialog.syncBoundElement("edit-view-model");
    },
    addView: function() {
        this.addNew();
    }
});
