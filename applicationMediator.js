const Augmented = require("augmentedjs");
	  	Augmented.Presentation = require("augmentedjs-presentation");
const CONSTANTS = require("./constants.js"),
      app = require("./application.js"),
			Compiler = require("./compiler.js"),
			AMDCompiler = require("./compiler-amd.js"),
      FileSaver = require("file-saver"),
      logger = require("./logger.js");

module.exports = Augmented.Presentation.Mediator.extend({
    name: CONSTANTS.NAMES_AND_QUEUES.MEDIATOR,
    el: CONSTANTS.MAIN_VIEW_MOUNT,
    init: function(options) {
        // hamburger events
        this.on(CONSTANTS.MESSAGES.CREATE_PROJECT, function(name) {
            logger.info("Created new project - " + name);
						app.setDatastoreItem("project", name);
            app.navigate(CONSTANTS.NAVIGATION.PROJECT);
            this.publish(CONSTANTS.NAMES_AND_QUEUES.HEADER, CONSTANTS.MESSAGES.NOTIFICATION, "Project " + name + " Created.");
        });
        this.on(CONSTANTS.MESSAGES.OPEN_PROJECT, function(file) {
            logger.info("Opening a project - " + file);

            var reader = new FileReader(), that = this;

            reader.onload = function(e) {
                var text = reader.result, data;
                try {
                    data = JSON.parse(text);
										app.setDatastore(data);

                    app.navigate(CONSTANTS.NAVIGATION.PROJECT);
                    that.publish(CONSTANTS.NAMES_AND_QUEUES.HEADER, CONSTANTS.MESSAGES.NOTIFICATION, "Project Loaded.");
                } catch(ex) {
                    alert("Failed to read file! " + ex);
                    logger.info("Failed to read file! " + ex);
                    that.publish(CONSTANTS.NAMES_AND_QUEUES.HEADER, CONSTANTS.MESSAGES.ERROR, "Project Load Failed!");
                }
            };

            reader.readAsText(file);
        });
        this.on(CONSTANTS.MESSAGES.SAVE_PROJECT, function(file) {
            logger.info("Saving a project - " + file);
            var blob = new Blob([JSON.stringify(app.getDatastore().toJSON())], {type: "text/plain;charset=utf-8"});
						if (!file.endsWith(".json")) {
							file = file + ".json";
						}

            FileSaver.saveAs(blob, file);
            this.publish(CONSTANTS.NAMES_AND_QUEUES.HEADER, CONSTANTS.MESSAGES.NOTIFICATION, "Save Project Complete.");
        });
        this.on(CONSTANTS.MESSAGES.COMPILE_PROJECT, function(style) {
            logger.info("Compiling a project wth style " + style);

						if (style === "amd") {
							AMDCompiler.compile(app.getDatastore().toJSON());
						} else {
							Compiler.compile(app.getDatastore().toJSON());
						}

            this.publish(CONSTANTS.NAMES_AND_QUEUES.HEADER, CONSTANTS.MESSAGES.NOTIFICATION, "Compile Complete!");
        });
				this.on(CONSTANTS.MESSAGES.CLOSE, function() {
						// close the app if electron is running
					 	const remote = require('electron').remote;
					 	var window = remote.getCurrentWindow();
       			window.close();
        });
        // end hamburger events
    }
});
