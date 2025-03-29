const   Augmented = require("augmentedjs");
        Augmented.Presentation = require("augmentedjs-presentation"),
        Handlebars = require("handlebars");
const CONSTANTS = require("./constants.js"),
  app = require("./application.js"),
  Models = require("./models.js"),
  EditDialog = require("./editDialog.js"),
  AbstractEditorView = require("./abstractEditorView.js");
        // ,
        // controllersTemplate = require("./templates/controllersTemplate.js");

var EditControllerDialog = EditDialog.extend({
    title: "Edit Controller",
    name: "edit-controller"
});

var ControllerCollection = Augmented.Collection.extend({
    model: Models.ControllerModel
});

// Controllers View
module.exports = AbstractEditorView.extend({
    name: CONSTANTS.NAMES_AND_QUEUES.CONTROLLERS,
    el: CONSTANTS.VIEW_MOUNT.CONTROLLERS,
    init: function() {
        this.collection = new ControllerCollection();
        var arr = app.getDatastoreItem("controllers");
        if (arr) {
            this.collection.reset(arr);
        }
        this.render();
    },
    render: function() {
        // refresh the data
        app.setDatastoreItem("controllers", this.collection.toJSON());

        var e = this.boundElement("currentControllers");
        this.removeTemplate(e, true);
        this.injectTemplate(Handlebars.templates.controllersTemplate({"controllers": this.collection.toJSON()}), e);
    },
    editController: function(event) {
        this.editCurrent(event);
    },
    setModel: function(arr) {
        this.model.set("currentControllers", arr);
        app.setDatastoreItem("controllers", arr);
    },
    saveController: function() {
        var controller = this.dialog.model.get("controller");
        if (controller) {
            var index = this.dialog.model.get("index");
            var model = this.collection.at(index);

            if (model && index != -1) {
                model.set("controller", controller);
                this.collection.push(model);
            } else {
                model = new Models.ControllerModel({"controller": controller});
                this.collection.add(model);
            }

            this.render();
        }
    },
    deleteController: function() {
        this.deleteCurrent();
    },
    currentControllers: function(event) {
        var index = (event.target.getAttribute("data-index"));
        var a = this.model.get("currentControllers");
        this.openDialog(a, index);
    },
    openDialog: function(model, index) {
        if (!this.dialog) {
            this.dialog = new EditControllerDialog();
            this.listenTo(this.dialog, CONSTANTS.MESSAGES.SAVE, this.saveController);
            this.listenTo(this.dialog, CONSTANTS.MESSAGES.DELETE, this.deleteController);
            this.listenTo(this.dialog, CONSTANTS.MESSAGES.CLOSE, this.closeDialog);
        }

        if (index === -1) {
            this.dialog.title = "Add New Controller";
            this.dialog.buttons = {
                "cancel": "cancel",
                "ok" : "ok"
            };
        } else {
            this.dialog.title = "Edit Controller";
            this.dialog.buttons = {
                "cancel": "cancel",
                "ok" : "ok",
                "delete": "del"
            };
        }

        if (!model) {
            model = new Models.ControllerModel();
        }

        this.dialog.model.set("index", index);
        this.dialog.body =
            "<label for=\"edit-controller\">Name</label>" +
            "<input type=\"text\" value=\"" + ((model) ? model.get("controller") : "") +
                "\" data-edit-controller=\"controller\" name=\"name\" placeholder=\"Name\" required/>";
        this.dialog.render();
        this.dialog.syncBoundElement("controller");
    },
    addController: function() {
        this.addNew();
    }
});
