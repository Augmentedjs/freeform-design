// const   Augmented = require("augmentedjs");
const
  // Models = require("./models.js"),
        JSZip = require("jszip"),
        FileSaver = require("file-saver");

module.exports = {
    compile: function(model) {
        var zip = new JSZip();

        if (model) {
            var i = 0, l;

            // the html
            var html = "<!DOCTYPE html>\n<html>\n\t<head>\n\t<meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\"/>\n\t<title>" + model.project + "</title>\n";
            // add sync stylesheets
            var syncStylesheets = this.extractStylesheets(model.stylesheets, false);

            l = syncStylesheets.length;
            for(i = 0; i < l; i++) {
                html = html + "\t<link type=\"text/css\" rel=\"stylesheet\" href=\"" + syncStylesheets[i] + "\"/>\n";
            }
            html = html + "\t<script data-main=\"scripts/" + model.project + ".js\" src=\"scripts/lib/require.js\"></script>\n\t</head>\n\t<body>\n\t\t<article>\n\t\t\t<section id=\"main\">\n\t\t\t</section>\n\t\t</article>\n\t</body>\n</html>";

            // base require
            var req = "require.config({'baseUrl': 'scripts/',\n'paths': {\n'jquery': 'lib/jquery.min', 'underscore': 'lib/lodash.min', 'backbone': 'lib/backbone-min', 'handlebars': 'lib/handlebars.runtime.min','augmented': 'scripts/lib/augmented','augmentedPresentation': 'scripts/lib/augmentedPresentation' }, 'shim': { } });" +
                    "\n\n\\\\views\n\nrequire(['augmented', 'augmentedPresentation'],\nfunction(Augmented, Presentation) {\n\"use strict\";\n";

            // application
            var application = "define('application', ['augmented', 'augmentedPresentation'], function(Augmented) {\n\"use strict\";\n\tvar app = new Augmented.Presentation.Application(\"" + model.project + "\");\n";
            // add async stylesheets
            var asyncStylesheets = this.extractStylesheets(model.stylesheets, true);

            l = asyncStylesheets.length;
            for(i = 0; i < l; i++) {
                application = application + "\tapp.registerStylesheet(\"" + asyncStylesheets[i] + "\");\n";
            }
            application = application + "\n\treturn app;\n});";

            // router
            var router = "define('router', ['augmented', 'augmentedPresentation'], function(Augmented) {\n\"use strict\";\n";
            router = router + "\n\tvar router = Augmented.Router.extend({\n\troutes: {";
            // function routes
            l = model.routes.length;
            var func = "";
            for(i = 0; i < l; i++) {
                if (model.routes[i].type === "function") {
                    router = router + "\n\t\"" + model.routes[i].route + "\": \"" + model.routes[i].callback + "\",";
                    func = func + "\n\"" + model.routes[i].callback + "\"" + ": function() { },";
                } else if (model.routes[i].type === "view") {
                    router = router + "\n\t\"" + model.routes[i].route + "\": \"" + model.routes[i].callback + "\",";
                    func = func + "\n\"" + model.routes[i].callback + "\"" + ": function() { this.loadView(new " + model.routes[i].callback + "()); },";
                } else if (model.routes[i].type === "controller") {
                    router = router + "\n\t\"" + model.routes[i].route + "\": \"" + model.routes[i].callback + "\",";
                    func = func + "\n\"" + model.routes[i].callback + "\"" + ": function() { this.loadView(" + model.routes[i].callback + ".initialize()); },";
                }
            }

            // remove the last comma
            router = router.slice(0, -1);
            func = func.slice(0, -1);

            router = router + "\n\t}, " + func + "\t});\n\treturn router;\n});";

            // Schemas
            l = model.schemas.length;
            for(i = 0; i < l; i++) {
                req = req + "\n\n" + this.compileSchema(model.schemas[i]);
            }

            // Models
            l = model.models.length;
            for(i = 0; i < l; i++) {
                req = req + "\n\n" + this.compileModel(model.models[i]);
            }

            // controllers
            l = model.controllers.length;
            for(i = 0; i < l; i++) {
                req = req + "\nvar " + model.controllers[i].controller +
                    " = Augmented.Presentation.ViewController.extend({\nrender: function() {\n },\n initialize: function() {\nreturn this;\n},\nremove: function() {\n}\n});\n";
            }

            // views
            var mediation = "";
            l = model.views.length;
            for(i = 0; i < l; i++) {
                if (model.views[i].type === "AutomaticTable") {
                    req = req + "\n\n" + this.compileTable(model.views[i], model.views[i].settings);
                } else if(model.views[i].type === "AutomaticForm") {
                    req = req + "\n\n" + this.compileForm(model.views[i]);
                } else if (model.views[i].type === "DialogView") {
                    req = req + "\n\n" + this.compileDialog(model.views[i]);
                } else {
                    req = req + "\nvar " + model.views[i].name + " = " +
                        ((model.views[i].type === "View") ? "Augmented." : "Augmented.Presentation.") +
                        model.views[i].type + ".extend({\n";

                    if (model.views[i].permissions) {
                        req = req + "\"permissions\": " + JSON.stringify(model.views[i].permissions);
                    }
                    if (model.views[i].model) {
                        req = req + ", \"model\": " + model.views[i].model;
                    }
                    req = req + "});\n";
                }
                if (model.views[i].type === "Mediator") {
                    mediation = mediation + this.compileMediation(model.views[i]);
                }
            }

            req = req + "\n" + mediation + "\n});";

            zip.file("index.html", html);
            zip.folder("scripts").file(model.project + ".js", req);
            zip.folder("scripts").file("router.js", router);
            zip.folder("scripts").file("application.js", application);
            zip.folder("styles");

            zip.generateAsync({type:"blob"})
            .then(function(blob) {
                var fn = model.project + ".zip";
                var result =
                      fn.
                      split(" ").
                      join("");
                FileSaver.saveAs(blob, result);
            });

            //return html + " \n\n " + req + " \n\n " + router + " \n\n " + application;
            //zip it
            return zip;
        }
        return "";
    },
    compileModel: function(model) {
        return "var " + model.name + " = Augmented.Model.extend({ \"url\": \"" + ((model.url) ? model.url : null) + "\", \"schema\": " + ((model.schema) ? model.schema : null) + " });";
    },
    compileSchema: function(schema) {
        return "var " + schema.name + " = " + ((schema.url) ? schema.url : JSON.stringify(schema.schema)) + ";";
    },
    compileMediation: function(view) {
        var code = "", i, l = (view.observeList) ? view.observeList.length : 0;
        for(i = 0; i < l; i++) {
            code = code + view.name + ".observeColleagueAndTrigger(\n" +
                "\t" + view.observeList[i].view + ",\n" +
                "\t'" + view.observeList[i].channel + "',\n" +
                "\t'" + view.observeList[i].identifier + "'\n" +
            ");\n\n";
        }
        return code;
    },
    compileDialog: function(viewModel) {
        var code =  "var " + viewModel.name +
            " = Augmented.Presentation.DialogView.extend({\n" +
            "\tstyle: \"" + viewModel.style + "\", \n" +
            "\tel: \"#" + viewModel.name + "\", \n" +
            "\tbuttons: " + JSON.stringify(viewModel.buttons) + ",";
        // add button functions
        var i = 0, keys = Object.keys(viewModel.buttons), l = keys.length;
        for (i = 0; i < l; i++) {
            var func = viewModel.buttons[keys[i]];
            code = code + "\n\t" + func + ": function(event) {},";
        }
        code = code.slice(0, -1);

        if (viewModel.permissions) {
            code = code + ", \"permissions\": " + JSON.stringify(viewModel.permissions);
        }
        code = code + "\n});";
        return code;
    },
    compileTable: function(viewModel, settings) {
        return "var " + viewModel.name + "schema = " + JSON.stringify(viewModel.schema) + ";\n\n" +
            "var " + viewModel.name +
            " = Augmented.Presentation.AutomaticTable.extend({\n" +
            "\tinit: function(options) { }\n" +
            "});\n\n" +
            "var at = new " + viewModel.name + "({ " +
                "\tschema: " + viewModel.name + "schema, \n" +
                "\tel: \"#autoTable\", \n" +
                "\tlineNumbers: " + String(settings.lineNumbers) + ",\n" +
                "\tsortable: " + String(settings.sortable) + ",\n" +
                "\teditable: " + String(settings.editable) + ",\n" +
                "\turl: \"http://www.example.com/data\", \n" +
                "\tpermissions: " + JSON.stringify(viewModel.permissions) +
            "});\n\n" +
            "at.render();";
    },
    compileForm: function(viewModel) {
        return "var " + viewModel.name + "schema = " + JSON.stringify(viewModel.schema) + ";\n\n" +
            "var " + viewModel.name +
            " = Augmented.Presentation.AutomaticForm.extend({\n" +
            "\tinit: function(options) { }\n" +
            "});\n\n" +
            "var f = new " + viewModel.name + "({ " +
                "\tschema: " + viewModel.name + "schema, \n" +
                "\tel: \"#autoForm\", \n" +
                "\turl: \"http://www.example.com/data\", \n" +
                "\tpermissions: " + JSON.stringify(viewModel.permissions) +
            "});\n\n" +
            "f.render();";
    },
    extractStylesheets: function(arr, as) {
        var a = [], i = 0, l = arr.length;

        for (i = 0; i < l; i++) {
            if (arr[i].async === as) {
                a.push(arr[i].stylesheet);
            }
        }

        return a;
    }
};
