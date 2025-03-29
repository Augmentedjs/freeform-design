const   Augmented = require("augmentedjs");
	    Augmented.Presentation = require("augmentedjs-presentation"),
        Handlebars = require("handlebars");
const   CONSTANTS = require("./constants.js"),
        app = require("./application.js"),
        // Models = require("./models.js"),
        BasicInfoView = require("./basicInfoView.js"),
        AutoViewMediator = require("./autoViewMediator.js"),
        SchemaDecoratorView = require("./schemaDecoratorView.js"),
        Compiler = require("./compiler.js"),
        logger = require("./logger.js");

// define the classes
var TableCreateMediator = AutoViewMediator.extend({
    name: CONSTANTS.NAMES_AND_QUEUES.TABLE_MEDIATOR,
    render: function() {
        this.currentView = app.getCurrentView();
        if (!this.currentView) {
            this.currentView = { index: 0, "model": {
                "name": "untitled",
                "type": "AutomaticTable",
                "permissions": {
                    "include": [],
                    "exclude": []
                }
            }};
        }

        var t = document.querySelector(CONSTANTS.TEMPLATES.TABLE_EDITOR);
        var clone = document.importNode(t.content, true);
        this.el.appendChild(clone);
    }
});

var MyTable = Augmented.Presentation.AutomaticTable.extend({
    setTheme: function(theme) {
        var e = document.querySelector(this.el + " > table");
        if (e) {
            e.setAttribute("class", theme);
        }
    }
});

var ViewerDecoratorView = Augmented.Presentation.DecoratorView.extend({
    name: CONSTANTS.NAMES_AND_QUEUES.VIEWER,
    el: CONSTANTS.VIEW_MOUNT.VIEWER,
    settings: {
        sortable: false,
        editable: false,
        lineNumbers: false,
        theme: "material"
    },
    themes: {
        "material": { name:         "Material",
                      stylesheet:   "styles/table/material.css"
                    },
        "plain":    { name:         "Plain",
                      stylesheet:   "styles/table/plain.css"
                    },
        "spaceGray":{ name:         "Space Gray",
                      stylesheet:   "styles/table/spaceGray.css"
                    }
    },
    init: function() {
        //defaults
        this.setTheme(this.settings.theme);
        this.on(CONSTANTS.MESSAGES.COMPILE, function(data) {
            // do something
            this.schema = data;
            if (this.schema) {
                this.compile();
            }
        });
        this.on(CONSTANTS.MESSAGES.REQUEST_DATA, function(message) {
            this.sendMessage(CONSTANTS.MESSAGES.YOUR_DATA_REQUEST, this.getFullDataset());
        });
        this.on(CONSTANTS.MESSAGES.UPDATE_SETTINGS, function(settings) {
            this.settings = settings;
            this.setEditable(settings.editable);
            this.setSortable(settings.sortable);
            this.setLineNumbers(settings.lineNumbers);
            this.setTheme(settings.theme);
        });
    },
    getFullDataset: function() {
        return {
            data: this.data,
            schema: this.schema,
            settings: this.settings
        };
    },
    setEditable: function(toggle) {
        var e = this.boundElement("editable");
        if (toggle) {
            this.settings.editable = true;
            e.firstElementChild.classList.remove("hidden");
        } else {
            this.settings.editable = false;
            e.firstElementChild.classList.add("hidden");
        }
    },
    editableToggle: function() {
        if (this.settings.editable === true) {
            this.setEditable(false);
        } else {
            this.setEditable(true);
        }
        this.sendMessage(CONSTANTS.MESSAGES.UPDATE_SETTINGS, this.settings);
        this.compile();
    },
    setSortable: function(toggle) {
        var e = this.boundElement("sortable");
        if (toggle) {
            this.settings.sortable = true;
            e.firstElementChild.classList.remove("hidden");
        } else {
            this.settings.sortable = false;
            e.firstElementChild.classList.add("hidden");
        }
    },
    sortableToggle: function() {
        if (this.settings.sortable === true) {
            this.setSortable(false);
        } else {
            this.setSortable(true);
        }
        this.sendMessage(CONSTANTS.MESSAGES.UPDATE_SETTINGS, this.settings);
        this.compile();
    },
    setLineNumbers: function(toggle) {
        var e = this.boundElement("lineNumber");
        if (toggle) {
            this.settings.lineNumbers = true;
            e.firstElementChild.classList.remove("hidden");
        } else {
            this.settings.lineNumbers = false;
            e.firstElementChild.classList.add("hidden");
        }
    },
    lineNumbersToggle: function() {
        if (this.settings.lineNumbers === true) {
            this.setLineNumbers(false);
        } else {
            this.setLineNumbers(true);
        }
        this.sendMessage(CONSTANTS.MESSAGES.UPDATE_SETTINGS, this.settings);
        this.compile();
    },
    theme: function(e) {
        var item = e.target;
        var theme = item.getAttribute(this.bindingAttribute());
        this.setTheme(theme);
        this.sendMessage(CONSTANTS.MESSAGES.UPDATE_SETTINGS, this.settings);
    },
    setTheme: function(t) {
        this.settings.theme = t;
        var i = 0, keys = Object.keys(this.themes), l = keys.length, theme, bound;
        for (i = 0; i < l; i++) {
            theme = keys[i];
            bound = this.boundElement(theme);
            if (this.settings.theme === theme) {
                bound.firstElementChild.classList.remove("hidden");
            } else {
                bound.firstElementChild.classList.add("hidden");
            }
        }
        this.compile();
    },
    compile: function() {
        if (this.myTableView && this.schema) {
            this.myTableView.setSchema(this.schema);
            this.myTableView.sortable = this.settings.sortable;
            this.myTableView.editable = this.settings.editable;
            this.myTableView.lineNumbers = this.settings.lineNumbers;
            this.myTableView.populate(this.data);
            this.myTableView.render();
            this.myTableView.setTheme(this.settings.theme);
        } else if (this.schema){
            this.myTableView = new MyTable({
                schema: this.schema,
                data: this.data,
                sortable: this.settings.sortable,
                editable: this.settings.editable,
                lineNumbers: this.settings.lineNumbers,
                el: CONSTANTS.VIEW_MOUNT.RENDER_WINDOW
            });
            this.myTableView.render();
            this.myTableView.setTheme(this.settings.theme);
        }
        if (this.schema){
            this.sendMessage(CONSTANTS.MESSAGES.YOUR_DATA_REQUEST, this.getFullDataset());
        }
    },
    generate: function() {
        if (this.schema && this.schema.properties) {
            var i = 0, ii = 0, keys = Object.keys(this.schema.properties), l = keys.length, obj = {};
            this.data = [];
            for (ii = 0; ii < 5; ii++) {
                obj = {};
                for (i = 0; i < l; i++) {
                    obj[keys[i]] = this.makeUpData(
                        this.schema.properties[keys[i]].type,
                        this.schema.properties[keys[i]].format,
                        this.schema.properties[keys[i]].enum
                    );
                }
                this.data.push(obj);
            }
        }
        this.compile();
    },
    makeUpData: function(type, format, en) {
        if (type === "string") {
            if (format && format === "email") {
                return "test" + Math.random() + "@example.com";
            } else if (en) {
                var max = en.length, min = 0;
                var v = Math.floor(Math.random() * (max - min + 1)) + min;
                return en[v];
            }
            return "test" + Math.random();
        } else if (type === "integer") {
            return Math.floor(Math.random() * 100);
        } else if (type === "number") {
            return Math.random() * 100;
        } else if (type === "boolean") {
            var b = Math.floor(Math.random() * (1 - 0 + 1)) + 1;
            return (b == 1) ? true : false;
        }
        return null;
    },
    cleanup: function() {
        if (this.myTableView) {
            this.myTableView.remove();
        }
    }
});

var SourceDecoratorView = Augmented.Presentation.DecoratorView.extend({
    name: CONSTANTS.NAMES_AND_QUEUES.SOURCE,
    el: CONSTANTS.VIEW_MOUNT.SOURCE,
    init: function() {
        this.model = new Augmented.Model();
        this.syncModelChange();
        this.on(CONSTANTS.MESSAGES.COMPILE, function(data) {
            this.compile(data);
        });
        this.on(CONSTANTS.MESSAGES.UPDATE_YOUR_DATA, function(dataset) {
            if (dataset) {
                this.model.set("data", Augmented.Utility.PrettyPrint(dataset.data));
                this.model.set("settings", dataset.settings);
                this.compile(dataset.schema);
            }
        });
    },
    compile: function(data) {
        var view = app.getDatastoreItem("currentView");
        var settings = this.model.get("settings");
        var javascript = Compiler.compileTable(view.model, settings);
        this.model.set("javascript", javascript);

        var html = "<div id=\"autoTable\" class=\"" + settings.theme + "\"></div>";
        this.model.set("html", html);

        var css = "<link type=\"text/css\" rel=\"stylesheet\" href=\"styles/table/" + settings.theme + "\"/>";
        this.model.set("css", css);
    },
    save: function() {
        /*var blob = new Blob([JSON.stringify(this.model.toJSON())], {type: "text/plain;charset=utf-8"});
        saveAs(blob, "myTable.json");*/
    }
});

//TableCreateController
module.exports = Augmented.Presentation.ViewController.extend({
    render: function() {
        this.tableCreateMediatorView.render();

        // create the views - bindings happen automatically

        logger.info("Creating Table Child Views...");

        this.schemaView = new SchemaDecoratorView();
        this.viewerView = new ViewerDecoratorView();
        this.sourceView = new SourceDecoratorView();
        this.basicView = new BasicInfoView();

        logger.info("Listening to Child Views...");

        this.tableCreateMediatorView.observeColleagueAndTrigger(
            this.basicView, // colleague view
            CONSTANTS.NAMES_AND_QUEUES.BASIC,   // channel
            CONSTANTS.NAMES_AND_QUEUES.BASIC    // identifier
        );

        this.tableCreateMediatorView.observeColleagueAndTrigger(
            this.schemaView, // colleague view
            CONSTANTS.NAMES_AND_QUEUES.SCHEMA,   // channel
            CONSTANTS.NAMES_AND_QUEUES.SCHEMA    // identifier
        );

        this.tableCreateMediatorView.observeColleagueAndTrigger(
            this.viewerView, // colleague view
            CONSTANTS.NAMES_AND_QUEUES.VIEWER,   // channel
            CONSTANTS.NAMES_AND_QUEUES.VIEWER    // identifier
        );

        this.tableCreateMediatorView.observeColleagueAndTrigger(
            this.sourceView, // colleague view
            CONSTANTS.NAMES_AND_QUEUES.SOURCE,   // channel
            CONSTANTS.NAMES_AND_QUEUES.SOURCE    // identifier
        );

        this.tableCreateMediatorView.publish(CONSTANTS.NAMES_AND_QUEUES.BASIC, CONSTANTS.MESSAGES.UPDATE_NAME, this.tableCreateMediatorView.currentView.model.name);
        this.tableCreateMediatorView.updateSchema(this.tableCreateMediatorView.currentView.model.schema);
        this.tableCreateMediatorView.updateSettings(this.tableCreateMediatorView.currentView.model.settings);
    },
    initialize: function() {
        logger.info("Creating Table Mediator View...");

        this.tableCreateMediatorView = new TableCreateMediator();

        logger.info("Table Create ready.");

        return this;
    },
    remove: function() {
        this.basicView.remove();
        this.schemaView.remove();
        this.viewerView.remove();
        this.sourceView.remove();
        this.tableCreateMediatorView.remove();
        this.basicView = null;
        this.schemaView = null;
        this.viewerView = null;
        this.sourceView = null;
        this.tableCreateMediatorView = null;

        logger.info("Table Create removed.");
    }
});
