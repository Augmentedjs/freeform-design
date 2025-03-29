const   Augmented = require("augmentedjs");
const
// Models = require("./models.js"),
        JSZip = require("jszip"),
        FileSaver = require("file-saver");

module.exports = {
    compile: function(model) {
        let zip = new JSZip();

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
            html = html + "\t<script src=\"scripts/" + model.project + ".js\"></script>\n\t</head>\n\t<body>\n\t\t<article>\n\t\t\t<section id=\"main\">\n\t\t\t</section>\n\t\t</article>\n\t</body>\n</html>";

            // base require
            var req = '"use strict\";\n\n$ = require("jquery");\n_ = require("underscore");\nBackbone = require("backbone");\nHandlebars = require("handlebars");\nAugmented = require("augmentedjs");\nAugmented.Presentation = require("augmentedjs-presentation");\nvar app = require("application.js");\nvar router = require("router.js");';

            // application
            var application = "var router = require(\"router.js\");\n\nvar app = new Augmented.Presentation.Application(\"" + model.project + "\");\n";
            // add async stylesheets
            var asyncStylesheets = this.extractStylesheets(model.stylesheets, true);

            l = asyncStylesheets.length;
            for(i = 0; i < l; i++) {
                application = application + "\tapp.registerStylesheet(\"" + asyncStylesheets[i] + "\");\n";
            }
            application = application + "app.router = router;\n";

            application = application + "\n\tmodule.exports = app;";

            // router
            var router = "module.exports = Augmented.Router.extend({\n\troutes: {";
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
                //req = req + "\n\n" + this.compileSchema(model.schemas[i]);
                zip.folder("schemas").file(model.schemas[i].name + ".js", this.compileSchema(model.schemas[i]));
            }

            // Models
            l = model.models.length;
            for(i = 0; i < l; i++) {
                zip.folder("models").file(model.models[i].name + ".js", this.compileModel(model.models[i]));
            }

            // Collections
            l = model.collections.length;
            for(i = 0; i < l; i++) {
                zip.folder("collections").file(model.collections[i].name + ".js", this.compileCollection(model.collections[i]));
            }

            // controllers
            l = model.controllers.length;
            for(i = 0; i < l; i++) {
                var controller = "\nmodule.exports " +
                    " = Augmented.Presentation.ViewController.extend({\nrender: function() {\n },\n initialize: function() {\nreturn this;\n},\nremove: function() {\n}\n});\n";
                zip.folder("controllers").file(model.controllers[i].controller + ".js", controller);
            }

            // views
            var mediation = "";
            l = model.views.length;
            for(i = 0; i < l; i++) {
                if (model.views[i].type === "AutomaticTable") {
                    zip.folder("views").file(model.views[i].name + ".js", this.compileTable(model.views[i], model.views[i].settings));
                    //req = req + "\n\n" + this.compileTable(model.views[i], model.views[i].settings);
                } else if(model.views[i].type === "AutomaticForm") {
                    zip.folder("views").file(model.views[i].name + ".js", this.compileForm(model.views[i]));
                    //req = req + "\n\n" + this.compileForm(model.views[i]);
                } else if (model.views[i].type === "DialogView") {
                    zip.folder("views").file(model.views[i].name + ".js", this.compileDialog(model.views[i]));
                    //req = req + "\n\n" + this.compileDialog(model.views[i]);
                } else {
                    var view = "\nvar " + model.views[i].name + " = " +
                        ((model.views[i].type === "View") ? "Augmented." : "Augmented.Presentation.") +
                        model.views[i].type + ".extend({\n";

                    if (model.views[i].permissions) {
                        view = view + "\"permissions\": " + JSON.stringify(model.views[i].permissions);
                    }
                    if (model.views[i].model) {
                        view = view + ", \"model\": " + model.views[i].model;
                    }
                    view = view + "});\n\n module.exports = " + model.views[i].name + ";";
                    zip.folder("views").file(model.views[i].name + ".js", view);
                }
                if (model.views[i].type === "Mediator") {
                    mediation = mediation + this.compileMediation(model.views[i]);
                }
            }

            req = req + "\n" + mediation;

            zip.file("index.html", html);

            // package.json
            const packagejson = {
                "name": model.project,
                "version": "1.0.0",
                "description": "The " + model.project + " project",
                "main": model.project + ".js",
                "scripts": {
                },
                "repository": {
                    "type": "git",
                    "url": "git+https://github.com/something.git"
                },
                "keywords": [
                    "javascript"
                ],
                "author": "You <me@email.com> (http://www.myhomepage.com)",
                "license": "none",
                "dependencies": {
                    "xhr2": "*",
                    "augmentedjs": ">=1.4.0",
                    "augmentedjs-presentation": ">=1.1.0"
                },
                "devDependencies": {
                },
                "bugs": {
                    "url": "bugurl"
                },
                "homepage": "http://www.myhomepage.com"
            };

            zip.file("package.json", Augmented.Utility.PrettyPrint(packagejson, false, 0));

            zip.file(model.project + ".js", req);
            zip.file("router.js", router);
            zip.file("application.js", application);
            zip.folder("styles");
            zip.folder("images");
            zip.folder("test");

            // TODO: support collections
            zip.folder("collections");

            zip.generateAsync({type:"blob"})
            .then(function(blob) {
                var result =
                      model.project + ".zip".
                      split(" ").
                      join("");
                FileSaver.saveAs(blob, result);
            });
            //zip it
            return zip;
        }
        return "";
    },
    compileModel: function(model) {
        let schema = null;
        if (model.schema) {
            schema = (Augmented.isObject(model.schema)) ?
            "var " + model.name + "schema = " + JSON.stringify(model.schema) + ";\n\n" :
            "var schema = require(\"..\\schemas\\" + model.name + ".js\");\n\n";
        }
        var ret = "";
        if (model.schema) {
            ret = schema;
        }

        return ret + "var " + model.name + " = Augmented.Model.extend({ \"url\": \"" + ((model.url) ? model.url : null) + "\", \"schema\": " + ((model.schema) ? "schema" : null) + " });\n module.exports = " + model.name + ";";
    },
    compileCollection: function(collection) {
        let schema = null;
        if (collection.schema) {
            schema = (Augmented.isObject(collection.schema)) ?
            "var " + collection.name + "schema = " + JSON.stringify(collection.schema) + ";\n\n" :
            "var schema = require(\"..\\schemas\\" + collection.name + ".js\");\n\n";
        }
        let clazz = "";
        if (collection.pagination) {
            clazz = "PaginatedCollection";
        } else if (collection.localStorage) {
            clazz = "LocalStorageCollection";
        } else {
            clazz = "Collection";
        }
        var ret = "";
        if (collection.schema) {
            ret = schema;
        }

        return ret + "var " + collection.name + " = Augmented." + clazz + ".extend({ \"url\": \"" + ((collection.url) ? collection.url : null) +
            "\", \"schema\": " + ((collection.schema) ? "schema" : null) +
            ((collection.pagination && collection.paginationKey) ? (",\"paginationKey\": " + collection.paginationKey) : null) + " });\n module.exports = " + collection.name + ";";
    },
    compileSchema: function(schema) {
        return "var " + schema.name + " = " + ((schema.url) ? schema.url : JSON.stringify(schema.schema)) + ";\n module.exports = " + schema.name + ";";
    },
    compileMediation: function(view) {
        let code = "", i, l = (view.observeList) ? view.observeList.length : 0;
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
        let code =  "var " + viewModel.name +
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
        code = code + "\n});\n module.exports = " + viewModel.name + ";";
        return code;
    },
    compileTable: function(viewModel, settings) {
        let schema = (Augmented.isObject(viewModel.schema)) ?
            "var " + viewModel.name + "schema = " + JSON.stringify(viewModel.schema) + ";\n\n" :
            "var " + viewModel.name + "schema = require(\"..\\schemas\\" + viewModel.name + ".js\");\n\n";
        return schema +
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
            "module.exports = " + viewModel.name + ";";
    },
    compileForm: function(viewModel) {
        let schema = (Augmented.isObject(viewModel.schema)) ?
            "var " + viewModel.name + "schema = " + JSON.stringify(viewModel.schema) + ";\n\n" :
            "var " + viewModel.name + "schema = require(\"..\\schemas\\" + viewModel.name + ".js\");\n\n";
        return schema +
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
            "module.exports = " + viewModel.name + ";"
    },
    extractStylesheets: function(arr, as) {
        let a = [], i = 0, l = arr.length;

        for (i = 0; i < l; i++) {
            if (arr[i].async === as) {
                a.push(arr[i].stylesheet);
            }
        }

        return a;
    }
};
