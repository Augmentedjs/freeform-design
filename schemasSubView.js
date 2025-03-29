const   Augmented = require("augmentedjs");
	    Augmented.Presentation = require("augmentedjs-presentation"),
        Handlebars = require("handlebars");
const CONSTANTS = require("./constants.js"),
  app = require("./application.js"),
  Models = require("./models.js"),
  EditDialog = require("./editDialog.js"),
  AbstractEditorView = require("./abstractEditorView.js");
// ,
//         schemasTemplate = require("./templates/schemasTemplate.js");

var EditSchemaDialog = EditDialog.extend({
    style: "bigForm",
    title: "Edit Schema",
    name: "edit-schema"
});

var SchemasCollection = Augmented.Collection.extend({
    model: Models.SchemaModel
});

//SchemasView
module.exports = AbstractEditorView.extend({
    name: CONSTANTS.NAMES_AND_QUEUES.SCHEMAS,
    el: CONSTANTS.VIEW_MOUNT.SCHEMAS,
    init: function() {
        this.collection = new SchemasCollection();
        var arr = app.getDatastoreItem("schemas");
        if (arr) {
            this.collection.reset(arr);
        }
        this.render();
    },
    render: function() {
        // refresh the data
        app.setDatastoreItem("schemas", this.collection.toJSON());

        var e = this.boundElement("currentSchemas");
        this.removeTemplate(e, true);
        this.injectTemplate(Handlebars.templates.schemasTemplate({"schemas": this.collection.toJSON()}), e);
    },
    editSchema: function(event) {
        this.editCurrent(event);
    },
    editSchemaDetail: function(event) {
        var index = (event.currentTarget.getAttribute("data-index"));
        var model = this.collection.at(index);
        app.setDatastoreItem("currentSchema", { "index": index, "model": model.toJSON() });
        app.navigate(CONSTANTS.NAVIGATION.SCHEMA);
    },
    setSchema: function(arr) {
        this.model.set("currentSchemas", arr);
        app.setDatastoreItem("schemas", arr);
    },
    saveSchema: function() {
        var name = this.dialog.model.get("name");
        if (name) {
            var url = this.dialog.model.get("url");
            var index = this.dialog.model.get("index");
            var model = this.collection.at(index);

            if (model && index != -1) {
                model.set("name", name);
                model.set("url", url);
                this.collection.push(model);
            } else {
                model = new Models.SchemaModel({"name": name, "url": url});
                this.collection.add(model);
            }

            this.render();
        }
    },
    deleteSchema: function() {
        this.deleteCurrent();
    },
    currentSchemas: function(event) {
        var index = (event.target.getAttribute("data-index"));
        var a = this.model.get("currentSchemas");
        this.openDialog(a, index);
    },
    openDialog: function(model, index) {
        if (!this.dialog) {
            this.dialog = new EditSchemaDialog();
            this.listenTo(this.dialog, CONSTANTS.MESSAGES.SAVE, this.saveSchema);
            this.listenTo(this.dialog, CONSTANTS.MESSAGES.DELETE, this.deleteSchema);
            this.listenTo(this.dialog, CONSTANTS.MESSAGES.CLOSE, this.closeDialog);
        }

        if (index === -1) {
            this.dialog.title = "Add New Schema";
            this.dialog.buttons = {
                "cancel": "cancel",
                "ok" : "ok"
            };
        } else {
            this.dialog.title = "Edit Schema";
            this.dialog.buttons = {
                "cancel": "cancel",
                "ok" : "ok",
                "delete": "del"
            };
        }

        if (!model) {
            model = new Models.SchemaModel();
        }

        this.dialog.model.set("index", index);
        this.dialog.body =
            "<label for=\"name\">Schema</label>" +
            "<input type=\"text\" value=\"" + ((model) ? model.get("name") : "") +
                "\" data-edit-schema=\"name\" name=\"name\" placeholder=\"Name\" required/>" +
            "<label for=\"url\">URL</label>" +
            "<input type=\"text\" value=\"" + ((model) ? model.get("url") : "") +
                "\" data-edit-schema=\"url\" name=\"url\" placeholder=\"Hosted URL\" />";
        this.dialog.render();
        this.dialog.syncBoundElement("name");
        this.dialog.syncBoundElement("url");
    },
    addSchema: function() {
        this.addNew();
    }
});
