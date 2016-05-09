define('stylesheetsSubView', ['augmented', 'augmentedPresentation', 'application', 'models', 'editDialog', 'handlebars',
//templates
'stylesheetsTemplate'],
    function(Augmented, Presentation, app, Models, EditDialog, Handlebars) {
    "use strict";
    var StylesheetCollection = Augmented.Collection.extend({
        model: Models.StylesheetsModel
    });

    var EditStylesheetDialog = EditDialog.extend({
        name: "edit-stylesheet"
    });

    var StylesheetsView = Augmented.Presentation.DecoratorView.extend({
        name: "stylesheets",
        el: "#stylesheets",
        init: function() {
            this.collection = new StylesheetCollection();
            var arr = app.datastore.get("stylesheets");
            if (arr) {
                this.collection.reset(arr);
            }
            this.render();
        },
        render: function() {
            // refresh the data
            app.datastore.set("stylesheets", this.collection.toJSON());

            var e = this.boundElement("stylesheetsTemplate");
            this.removeTemplate(e, true);
            this.injectTemplate(Handlebars.templates.stylesheetsTemplate({"stylesheets": this.collection.toJSON()}), e);
        },
        editStylesheet: function(event) {
            var index = (event.currentTarget.getAttribute("data-index"));
            var model = this.collection.at(index);
            this.openDialog(model, index);
        },
        saveStylesheet: function() {
            var ss = this.dialog.model.get("edit-stylesheet");
            if (ss) {
                var as = this.dialog.model.get("edit-stylesheet-async");
                var index = this.dialog.model.get("index");
                var model = this.collection.at(index);

                if (model && index != -1) {
                    model.set("stylesheet", ss);
                    model.set("async", as);
                    this.collection.push(model);
                } else {
                    model = new Models.StylesheetsModel({"stylesheet": ss, "async": as});
                    this.collection.add(model);
                }

                this.render();
            }
        },
        deleteStylesheet: function() {
            var index = this.dialog.model.get("index");
            var model = this.collection.at(index);
            this.collection.remove(model);
            this.render();
        },
        currentStylesheets: function(event) {
            var index = (event.target.getAttribute("data-index"));
            var a = this.model.get("currentStylesheets");
            this.openDialog(a, index);
        },
        openDialog: function(model, index) {
            if (!this.dialog) {
                this.dialog = new EditStylesheetDialog();
                this.listenTo(this.dialog, "save", this.saveStylesheet);
                this.listenTo(this.dialog, "delete", this.deleteStylesheet);
                this.listenTo(this.dialog, "close", this.closeDialog);
            }
            if (index === -1) {
                this.dialog.title = "Add New Stylesheet";
                this.dialog.buttons = {
                    "cancel": "cancel",
                    "ok" : "ok"
                };
            } else {
                this.dialog.title = "Edit Stylesheet";
                this.dialog.buttons = {
                    "cancel": "cancel",
                    "ok" : "ok",
                    "delete": "del"
                };
            }

            if (!model) {
                model = new Models.StylesheetsModel();
            }

            this.dialog.model.set("index", index);
            this.dialog.body = "<input type=\"text\" value=\"" + ((model) ? model.get("stylesheet") : "") +
                "\" data-edit-stylesheet=\"edit-stylesheet\" required/>" +
                "<input type=\"checkbox\" name=\"edit-stylesheet-async\" data-edit-stylesheet=\"edit-stylesheet-async\"" +
                ((model.get("async") === true) ? "checked=\"checked\"" : "") +
                " />" +
                "<label for=\"edit-stylesheet-async\">Asynchronous</label>";
            this.dialog.render();
            this.dialog.syncBoundElement("edit-stylesheet");
            this.dialog.syncBoundElement("edit-stylesheet-async");
        },
        closeDialog: function() {
        },
        addStylesheet: function() {
            this.openDialog(null, -1);
        }
    });
    return StylesheetsView;
});
