const   Augmented = require("augmentedjs");
	    Augmented.Presentation = require("augmentedjs-presentation"),
        Handlebars = require("handlebars");
const   CONSTANTS = require("./constants.js"),
        app = require("./application.js"),
        Models = require("./models.js"),
        EditDialog = require("./editDialog.js"),
        AbstractEditorMediator = require("./abstractEditorMediator.js"),
        BasicInfoView = require("./basicInfoView.js"),
        // permissionsTemplate = require("./templates/permissionsTemplate.js"),
        logger = require("./logger.js");

var PermissionCollection = Augmented.Collection.extend({
    model: Models.PermissionModel
});

var EditPermissionDialog = EditDialog.extend({
    title: "Edit Permission",
    name: "edit-permission"
});

var StandardViewEditorMediator = AbstractEditorMediator.extend({
    name: CONSTANTS.NAMES_AND_QUEUES.STANDARD_VIEW_EDITOR,
    init: function() {
        this.on(CONSTANTS.MESSAGES.GO_TO_PROJECT, function() {
            this.goToProject();
        });
        this.on(CONSTANTS.MESSAGES.UPDATE_DATA, function(data) {
            var permissions = {
                "include": [],
                "exclude": []
            };

            var i = 0, l = data.length;
            for (i = 0; i < l; i++) {
                if (data[i].exclude) {
                    permissions.exclude.push(data[i].permission);
                } else {
                    permissions.include.push(data[i].permission);
                }
            }
            this.currentView.model.permissions = permissions;
            this.saveData();
        });
    },
    render: function() {
        this.currentView = app.getCurrentView();
        if (!this.currentView) {
            this.currentView = {
                index: 0, "model": {
                "name": "untitled",
                "type": "View",
                "permissions": {
                    "include": [],
                    "exclude": []
                },
                "model": null
            }};
        }

        var t = document.querySelector(CONSTANTS.TEMPLATES.STANDARD_VIEW_EDITOR);
        var clone = document.importNode(t.content, true);
        this.el.appendChild(clone);
    }
});

var PermissionsView = Augmented.Presentation.DecoratorView.extend({
    name: CONSTANTS.NAMES_AND_QUEUES.PERMISSIONS,
    el: CONSTANTS.VIEW_MOUNT.PERMISSIONS,
    init: function() {
        this.collection = new PermissionCollection();
        this.on(CONSTANTS.MESSAGES.UPDATE_PERMISSIONS, function(permissions) {
            this.updatePermissions(permissions);
        });
    },
    updatePermissions: function(permissions) {
        var i = 0, l = permissions.include.length;
        for (i = 0; i < l; i++) {
            this.collection.add(new Models.PermissionModel({"permission": permissions.include[i], "exclude": false}));
        }
        l = permissions.exclude.length;
        for (i = 0; i < l; i++) {
            this.collection.add(new Models.PermissionModel({"permission": permissions.exclude[i], "exclude": true}));
        }
        this.render();
    },
    render: function() {
        var e = this.boundElement("currentPermissions");
        this.removeTemplate(e, true);
        this.injectTemplate(Handlebars.templates.permissionsTemplate({"currentPermissions": this.collection.toJSON()}), e);
        this.el.style.height = (Augmented.Presentation.Dom.getViewportHeight() - 160) + "px";
        this.sendMessage(CONSTANTS.MESSAGES.UPDATE_DATA, this.collection.toJSON());
    },
    addPermission: function(event) {
        var e = event.target, p = e.getAttribute("data-permission"), x = e.getAttribute("data-exclude");
        var data = { "permission": p, "exclude": x };
        this.openDialog(data, -1);
    },
    editPermission: function(event) {
        var index = (event.currentTarget.getAttribute("data-index"));
        var model = this.collection.at(index);
        this.openDialog(model.toJSON(), index);
    },
    openDialog: function(data, index) {
        if (!this.dialog) {
            this.dialog = new EditPermissionDialog();

            this.listenTo(this.dialog, CONSTANTS.MESSAGES.SAVE, this.savePermission);
            this.listenTo(this.dialog, CONSTANTS.MESSAGES.DELETE, this.deletePermission);
            this.listenTo(this.dialog, CONSTANTS.MESSAGES.CLOSE, this.closeDialog);
        }
        if (index === -1) {
            this.dialog.title = "Add Permission";
            this.dialog.buttons = {
                "cancel": "cancel",
                "ok" : "ok",
            };
        } else {
            this.dialog.title = "Edit Permission";
            this.dialog.buttons = {
                "cancel": "cancel",
                "ok" : "ok",
                "delete": "del"
            };
        }
        this.dialog.model.set("index", index);
        this.dialog.body = "<input type=\"text\" value=\"" +
            ((data && (index > -1)) ? (data.permission) : "") + "\" data-edit-permission=\"edit-permission\" />" +
            "<div class=\"group\"><label for=\"exclude\">Exclude</label><input id=\"exclude\" type=\"checkbox\" data-edit-permission=\"exclude\"" +
            (((data && (index > -1)) && data.exclude) ? "checked=\"checked\"" : "") + "/></div>";
        this.dialog.render();
        this.dialog.syncBoundElement("edit-permission");
    },
    closeDialog: function() {
    },
    savePermission: function() {
        var p = this.dialog.model.get("edit-permission");
        var index = this.dialog.model.get("index");
        var x = this.dialog.model.get("exclude");

        var model = this.collection.at(index);

        if (model && index != -1) {
            model.set("permission", p);
            model.set("exclude", x);
            this.collection.push(model);
        } else {
            model = new Models.PermissionModel({"permission": p, "exclude": x});
            this.collection.add(model);
        }

        this.render();
    },
    deletePermission: function() {
        var index = this.dialog.model.get("index");
        var model = this.collection.at(index);
        this.collection.remove(model);
        this.render();
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

//StandardViewEditorController
module.exports = Augmented.Presentation.ViewController.extend({
    render: function() {
        this.mediator.render();
        var basicView = new BasicInfoView();
        var permissionsView = new PermissionsView();
        this.manageView(basicView);
        this.manageView(permissionsView);

        logger.info("Listening to Child Views...");

        this.mediator.observeColleagueAndTrigger(
            basicView, // colleague view
            CONSTANTS.NAMES_AND_QUEUES.BASIC,   // channel
            CONSTANTS.NAMES_AND_QUEUES.BASIC    // identifier
        );

        this.mediator.observeColleagueAndTrigger(
            permissionsView, // colleague view
            CONSTANTS.NAMES_AND_QUEUES.PERMISSIONS,   // channel
            CONSTANTS.NAMES_AND_QUEUES.PERMISSIONS    // identifier
        );

        this.mediator.publish(CONSTANTS.NAMES_AND_QUEUES.BASIC, CONSTANTS.MESSAGES.UPDATE_NAME, this.mediator.currentView.model.name);
        this.mediator.publish(CONSTANTS.NAMES_AND_QUEUES.PERMISSIONS, CONSTANTS.MESSAGES.UPDATE_PERMISSIONS,
            this.mediator.currentView.model.permissions);
    },
    initialize: function() {
        logger.info("Creating StandardViewEditorController ...");
        this.mediator = new StandardViewEditorMediator();
        logger.info("ready.");
        return this;
    },
    remove: function() {
        this.removeAllViews();
        this.mediator.remove();
        this.mediator = null;
    }
});
