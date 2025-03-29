const   Augmented = require("augmentedjs");
        Augmented.Presentation = require("augmentedjs-presentation"),
        Handlebars = require("handlebars");
const   CONSTANTS = require("./constants.js"),
        app = require("./application.js"),
        // Models = require("./models.js"),
        // EditDialog = require("./editDialog.js"),
        BasicInfoView = require("./basicInfoView.js"),
        AbstractEditorMediator = require("./abstractEditorMediator.js"),
        logger = require("./logger.js");

const VIEWPORT_OFFSET = 160;

var DialogEditorMediator = AbstractEditorMediator.extend({
    name: CONSTANTS.NAMES_AND_QUEUES.DIALOG_EDITOR_MEDIATOR,
    init: function() {
        this.on(CONSTANTS.MESSAGES.GO_TO_PROJECT, function() {
            this.goToProject();
        });
        this.on(CONSTANTS.MESSAGES.UPDATE_DATA, function(data) {
            this.publish(CONSTANTS.NAMES_AND_QUEUES.DIALOG, CONSTANTS.MESSAGES.DIALOG_DATA, data);
            this.currentView.model = data;
            this.saveData();
        });
    },
    render: function() {
        this.currentView = app.getDatastoreItem("currentView");
        if (!this.currentView) {
            this.currentView = {
                index: 0,
                "model": {
                "name": "untitled",
                "type": "Dialog",
                "style": "form",
                "permissions": {
                    "include": [],
                    "exclude": []
                },
                "buttons": {
                    "cancel": "cancel"
                }
            }};
        }

        var t = document.querySelector(CONSTANTS.TEMPLATES.DIALOG_EDITOR);
        var clone = document.importNode(t.content, true);
        this.el.appendChild(clone);
    }
});

var DialogEditorView = Augmented.Presentation.DecoratorView.extend({
    name: CONSTANTS.NAMES_AND_QUEUES.DIALOG_EDITOR,
    el: CONSTANTS.VIEW_MOUNT.DIALOG_EDITOR,
    init: function() {
        this.on(CONSTANTS.MESSAGES.DIALOG_DATA, function(data) {
            this.model.set(data);
        });
        this.syncModelChange();
        this.bindModelChange(this.notify);
    },
    render: function() {
        this.el.style.height = (Augmented.Presentation.Dom.getViewportHeight() - VIEWPORT_OFFSET) + "px";
    },
    notify: function() {
        var buttons = {},
        button0 = this.model.get("button0"),
        button1 = this.model.get("button1"),
        button2 = this.model.get("button2"),
        button3 = this.model.get("button3");
        if (button0) {
            buttons[button0] = button0;
        } else {
            buttons.cancel = "cancel";
        }
        if (button1) {
            buttons[button1] = button1;
        }
        if (button2) {
            buttons[button2] = button2;
        }
        if (button3) {
            buttons[button3] = button3;
        }
        this.model.set("buttons", buttons);

        this.sendMessage(CONSTANTS.MESSAGES.UPDATE_DATA, this.model.toJSON());
    }
});

var DialogViewerView = Augmented.Presentation.DecoratorView.extend({
    name: CONSTANTS.NAMES_AND_QUEUES.DIALOG_VIEWER,
    el: CONSTANTS.VIEW_MOUNT.DIALOG_VIEWER,
    init: function() {
        this.on(CONSTANTS.MESSAGES.DIALOG_DATA, function(data) {
            this.model.set(data);
            var dialog = this.boundElement("dialogCanvas");
            Augmented.Presentation.Dom.removeClass(dialog, "alert");
            Augmented.Presentation.Dom.removeClass(dialog, "form");
            Augmented.Presentation.Dom.removeClass(dialog, "bigForm");
            if (!this.model.get("style")) {
                this.model.set("style", "form");
            }

            Augmented.Presentation.Dom.addClass(dialog, this.model.get("style"));


            var bEl = this.boundElement("buttons");
            Augmented.Presentation.Dom.setValue(bEl, this._getButtonGroup());

        });
        this.syncModelChange("title");
        this.syncModelChange("body");
    },
    render: function() {
        this.el.style.height = (Augmented.Presentation.Dom.getViewportHeight() - VIEWPORT_OFFSET) + "px";
    },
    _getButtonGroup: function() {
        var buttons = this.model.get("buttons"), html = "<div class=\"buttonGroup\">";
        if (buttons) {
            var i = 0, keys = Object.keys(buttons), l = (keys) ? keys.length: 0;
            for (i = 0; i < l; i++) {
                html = html + "<button>" + keys[i] + "</button>";
            }
        }
        return html + "</div>";
    }
});

// DialogEditorController
module.exports = Augmented.Presentation.ViewController.extend({
    render: function() {
        this.mediator.render();
        var basicView = new BasicInfoView();
        var dialogEditorView = new DialogEditorView();
        var dialogViewerView = new DialogViewerView();
        dialogEditorView.render();
        dialogViewerView.render();
        this.manageView(basicView);
        this.manageView(dialogEditorView);
        this.manageView(dialogViewerView);
        logger.info("Listening to Child Views...");

        this.mediator.observeColleagueAndTrigger(
            basicView, // colleague view
            CONSTANTS.NAMES_AND_QUEUES.BASIC,   // channel
            CONSTANTS.NAMES_AND_QUEUES.BASIC    // identifier
        );

        this.mediator.observeColleagueAndTrigger(
            dialogEditorView, // colleague view
            CONSTANTS.NAMES_AND_QUEUES.DIALOG,   // channel
            CONSTANTS.NAMES_AND_QUEUES.DIALOG_EDITOR    // identifier
        );

        this.mediator.observeColleagueAndTrigger(
            dialogViewerView, // colleague view
            CONSTANTS.NAMES_AND_QUEUES.DIALOG,   // channel
            CONSTANTS.NAMES_AND_QUEUES.DIALOG_VIEWER    // identifier
        );

        this.mediator.publish(CONSTANTS.NAMES_AND_QUEUES.BASIC, CONSTANTS.MESSAGES.UPDATE_NAME, this.mediator.currentView.model.name);
        this.mediator.publish(CONSTANTS.NAMES_AND_QUEUES.DIALOG, CONSTANTS.MESSAGES.DIALOG_DATA, this.mediator.currentView.model);
    },
    initialize: function() {
        logger.info("Creating DialogEditorController ...");
        this.mediator = new DialogEditorMediator();
        logger.info("ready.");
        return this;
    },
    remove: function() {
        this.removeAllViews();
        this.mediator.remove();
        this.mediator = null;
    }
});
