const   Augmented = require("augmentedjs");
	    Augmented.Presentation = require("augmentedjs-presentation"),
        Handlebars = require("handlebars");
const CONSTANTS = require("./constants.js"),
  app = require("./application.js"),
  Models = require("./models.js"),
  EditDialog = require("./editDialog.js"),
  BasicInfoView = require("./basicInfoView.js"),
  AbstractEditorMediator = require("./abstractEditorMediator.js"),
  logger = require("./logger.js"),
  AbstractEditorView = require("./abstractEditorView.js");
// ,
//         observeViewsListTemplate = require("./templates/observeViewsListTemplate.js");

const VIEWPORT_OFFSET = 160;

var ObserveViewCollection = Augmented.Collection.extend({
    model: Models.ObserveViewModel
});

var ObserveViewDialog = EditDialog.extend({
    style: "bigForm",
    title: "Observe View",
    name: "observe-view"
});

var MediatorEditorMediator = AbstractEditorMediator.extend({
    name: CONSTANTS.NAMES_AND_QUEUES.MEDIATOR_EDITOR,
    init: function() {
        this.on(CONSTANTS.MESSAGES.GO_TO_PROJECT, function() {
            this.goToProject();
        });
        this.on(CONSTANTS.MESSAGES.UPDATE_DATA, function(data) {
            this.currentView.model.observeList = data;
            this.saveData();
        });
    },
    render: function() {
        this.currentView = app.getCurrentView();
        if (!this.currentView) {
            this.currentView = {
                index: 0,
                "model": {
                    "name": "untitled",
                    "type": "Mediator",
                    "permissions": {
                        "include": [],
                        "exclude": []
                    },
                    "observeList": []
                }
            };
        }

        var t = document.querySelector(CONSTANTS.TEMPLATES.MEDIATOR_EDITOR);
        var clone = document.importNode(t.content, true);
        this.el.appendChild(clone);
    }
});

var MediatorObserverListView = AbstractEditorView.extend({
    name: CONSTANTS.NAMES_AND_QUEUES.MEDIATOR,
    el: CONSTANTS.VIEW_MOUNT.MEDIATOR,
    mediatorName: "",
    init: function() {
        this.collection = new ObserveViewCollection();
        this.on(CONSTANTS.MESSAGES.MEDIATOR_DATA, function(data) {
            if (data) {
                this.collection.reset(data);
                this.render();
            }
        });
        this.on(CONSTANTS.MESSAGES.UPDATE_NAME, function(data) {
            this.mediatorName = data;
        });
    },
    render: function() {
        var e = this.boundElement("observeList");
        this.removeTemplate(e, true);
        this.injectTemplate(Handlebars.templates.observeViewsListTemplate({"views": this.collection.toJSON()}), e);
        this.el.style.height = (Augmented.Presentation.Dom.getViewportHeight() - VIEWPORT_OFFSET) + "px";
        this.sendMessage(CONSTANTS.MESSAGES.UPDATE_DATA, this.collection.toJSON());
    },
    observeNewView: function() {
        this.addNew();
    },
    openDialog: function(model, index) {
        var views = app.getViews();

        if (!this.dialog) {
            this.dialog = new ObserveViewDialog();

            this.listenTo(this.dialog, CONSTANTS.MESSAGES.SAVE, this.observeView);
            this.listenTo(this.dialog, CONSTANTS.MESSAGES.DELETE, this.dismissView);
            this.listenTo(this.dialog, CONSTANTS.MESSAGES.CLOSE, this.closeDialog);
        }

        if (!model) {
            model = new Models.ObserveViewModel();
        }

        if (index === -1) {
            this.dialog.title = "Observe New View";
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
        var name = ((model) ? model.get("view") : "");
        if (views && views.length > 0 && !(views.length === 1 && views[0].name === this.mediatorName)) {
            this.dialog.body = "<label>Views</label><select data-observe-view='view'>" +
                                this.formatViews(views, name) + "</select>" +
                                "<label>Channel</label><input type='text' data-observe-view='channel' value='" + ((model) ? model.get("channel") : "") + " ' />" +
                                "<label>Identifer</label><input type='text' data-observe-view='identifier' value='" + ((model) ? model.get("identifier") : "") + "'/>";
        } else {
            this.dialog.body = "There are no views.";
            this.dialog.buttons = {
                "cancel": "cancel"
            };
        }
        this.dialog.render();
        this.dialog.syncBoundElement("view");
        this.dialog.syncBoundElement("channel");
        this.dialog.syncBoundElement("identifier");
    },
    formatViews: function(views, name) {
        var html = "", i = 0, l = views.length;
        for (i = 0; i < l; i++) {
            // only support Colleagues
            if (views[i].type !== "View" && this.mediatorName !== views[i].name) {
                html = html + "<option value='" + views[i].name + "'";
                if (name === views[i].name) {
                    html = html + " selected='selected' ";
                }
                html = html + ">" + views[i].name + "</option>";
            }
        }
        return html;
    },
    observeView: function(event) {
        var view = this.dialog.model.get("view");
        if (view) {
            var index = this.dialog.model.get("index");
            var model = this.collection.at(index);
            var channel = this.dialog.model.get("channel");
            var identifier = this.dialog.model.get("identifier");

            if (model && index != -1) {
                model.set("view", view);
                model.set("channel", channel);
                model.set("identifier", identifier);
                this.collection.push(model);
            } else {
                model = new Models.ObserveViewModel({"view": view, "channel": channel, "identifier": identifier});
                this.collection.add(model);
            }

            this.render();
        }
    },
    dismissView: function() {
        this.deleteCurrent();
    },
    editView: function(event) {
        this.editCurrent(event);
    }
});

// MeditorEditorController
module.exports = Augmented.Presentation.ViewController.extend({
    render: function() {
        this.mediator.render();
        var basicView = new BasicInfoView();
        var mediatorListView = new MediatorObserverListView();
        mediatorListView.render();
        this.manageView(basicView);
        this.manageView(mediatorListView);

        logger.info("Listening to Child Views...");

        this.mediator.observeColleagueAndTrigger(
            basicView, // colleague view
            CONSTANTS.NAMES_AND_QUEUES.BASIC,   // channel
            CONSTANTS.NAMES_AND_QUEUES.BASIC    // identifier
        );

        this.mediator.observeColleagueAndTrigger(
            mediatorListView, // colleague view
            CONSTANTS.NAMES_AND_QUEUES.BASIC,   // channel
            CONSTANTS.NAMES_AND_QUEUES.LIST_VIEW    // identifier
        );

        this.mediator.observeColleagueAndTrigger(
            mediatorListView, // colleague view
            CONSTANTS.NAMES_AND_QUEUES.LIST,   // channel
            CONSTANTS.NAMES_AND_QUEUES.LIST    // identifier
        );

        this.mediator.publish(CONSTANTS.NAMES_AND_QUEUES.BASIC, CONSTANTS.MESSAGES.UPDATE_NAME, this.mediator.currentView.model.name);
        this.mediator.publish(CONSTANTS.NAMES_AND_QUEUES.LIST, CONSTANTS.MESSAGES.MEDIATOR_DATA,
            this.mediator.currentView.model.observeList);
    },
    initialize: function() {
        logger.info("Creating MediatorEditorController ...");
        this.mediator = new MediatorEditorMediator();
        logger.info("ready.");
        return this;
    },
    remove: function() {
        this.removeAllViews();
        this.mediator.remove();
        this.mediator = null;
    }
});
