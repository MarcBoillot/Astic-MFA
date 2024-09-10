sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "wwl/utils/Formatter"
], function (BaseController, JSONModel, Fragment, Formatter) {
    "use strict";
    let Models
    let Views

    return BaseController.extend("wwl.controller.PreparationItemsView", {
        Formatter: Formatter,

        onInit: async function () {
            Models = this.getOwnerComponent().ConfModel;
            Views = this.getOwnerComponent().ViewsModel;
            this.getOwnerComponent().getRouter()
                .getRoute("PreparationItemsViewPage")
                .attachMatched(this.onRouteMatch, this);
        },

        onRouteMatch: async function (oEvent) {
            const DocEntry = oEvent.getParameter("arguments").DocEntry;
            this._setModel({DocEntry: DocEntry}, "DocEntryModelSL")
            const orderSelected = await Models.Orders().filter(`contains(DocEntry, '${DocEntry}')`).get()
            this._setModel(orderSelected.value[0], "ItemsModelSL")
            console.log("orderSelected :::", orderSelected.value[0])

            const dataOrder = await this._getModel("ItemsModelSL").getData()
            this._setModel(dataOrder.DocumentLines, "DocumentLinesModelSL")
            const documentLines = dataOrder.DocumentLines
            console.log("documentLines:::", documentLines)

            this._setModel([], "EnabledLineModel")
        },

        onPressPreparationOrderViewPage: function () {
            this.getOwnerComponent().getRouter().navTo("PreparationOrderViewPage");
        },

        onQuantityChange: function (event) {
            const input = event.getSource();
            const value = input.getValue();
            const bindingContext = input.getBindingContext("DocumentLinesModelSL");
            const oModel = bindingContext.getModel();
            const sPath = bindingContext.getPath();
            oModel.setProperty(sPath + "/QuantityEntered", value);
            const quantityEntered = oModel.getProperty(sPath + "/QuantityEntered", value);
            const quantity = oModel.getProperty(sPath + "/Quantity");

            this.verificatorQuantityEntered(quantityEntered, quantity)
        },

        enabledCount: function (validate, notValidate) {
            let count = 0;
            if (validate === true && notValidate === false) {
                count + 1
            } else if (validate === false && notValidate === true) {
                count - 1
            }
            return count
        },

        verificatorEnabled: function () {

            // enabled.forEach(line => {
            //     console.log(line.enabled)
            // })
            // if (){
            //
            // }
        },

        onPressValidationLine: function (oEvent) {
            const event = oEvent.getSource();
            const BindingContext = event.getBindingContext("DocumentLinesModelSL");
            const Model = BindingContext.getModel();
            const Path = BindingContext.getPath();
            const quantityEntered = Model.getProperty(Path + "/QuantityEntered");
            const quantity = Model.getProperty(Path + "/Quantity");

            if (this.verificatorQuantityEntered(quantityEntered, quantity) === true) {
                const validation = Model.setProperty(Path + "/isValidated", true);
                // const active = Model.setProperty(Path + "/Enabled", false);
                console.log("enabled line ::", Model.getProperty(Path + "/Enabled"))
                console.log("validated line ::", validation)

                const validate = Model.getProperty(Path + "/isValidated")
                const notValidate = Model.getProperty(Path + "/Enabled")
                const quantityEntered = Model.getProperty(Path + "/QuantityEntered")
                const dataLine = {validate, Path, quantityEntered, quantity}
                console.log("data to push ::", dataLine)

                // const count = this.enabledCount(validate, notValidate)
                // console.log(count)

                const enabledLineModel = this._getModel("EnabledLineModel");
                const currentData = enabledLineModel.getData();
                currentData.push(dataLine);

                // Mettre à jour le modèle avec les nouvelles données
                enabledLineModel.setData(currentData);

                console.log("Model for enabled ::", enabledLineModel.getData());

            }
        },

        onPressCancelLine: function (oEvent) {
            const event = oEvent.getSource();
            const BindingContext = event.getBindingContext("DocumentLinesModelSL");
            const Model = BindingContext.getModel();
            const Path = BindingContext.getPath();
            Model.setProperty(Path + "/isValidated", false);
            Model.setProperty(Path + "/Enabled", true);
            const validate = false
            const notValidate = true

            // const count = this.enabledCount(validate, notValidate)
            // console.log(count)
        },

        verificatorQuantityEntered: function (QuantityEntered, Quantity) {
            const quantityValide = false
            if (QuantityEntered > Quantity) {
                new sap.m.MessageBox.error("Qté > Qté attendue")
                return quantityValide
            } else {
                const quantityValide = true
                return quantityValide
            }
        },

        onPressShowWhs: function (oEvent) {
            const event = oEvent.getSource();
            const BindingContext = event.getBindingContext("DocumentLinesModelSL");
            const Model = BindingContext.getModel();
            const Path = BindingContext.getPath();
            const WarehouseCode = Model.getProperty(Path + "/WarehouseCode");
            const Quantity = Model.getProperty(Path + "/Quantity");
            console.log("Model :::", Model)

            const LabelBox = new sap.m.Label({text: "Warehouse: " + `${WarehouseCode}`})
            const TextBox = new sap.m.Text({text: "Qté disponible: " + `${Quantity}`})
            let HboxWhs = new sap.m.VBox({
                items: [LabelBox, TextBox],
                alignItems: "Center"
            }).addStyleClass("sapUiSmallMargin");
            let dialog = new sap.m.Dialog({
                title: "Stock",
                content: [HboxWhs],
                endButton: new sap.m.Button({
                    text: "Fermer",
                    press: function () {
                        dialog.close();
                    }
                })
            });
            dialog.open()
        },

        onPressShowSerialNumbers: function () {
            SerialNumbers.forEach(line => {
                new sap.m.Text({text: "{line.DocDueDate}"})
                new sap.m.Text({text: "{line.SerialNum}"})
            })
        },

        onPressValidatePrep: async function (event) {
            const idOrderToPatch = this._getModel("DocEntryModelSL").getData().DocEntry
            console.log("idOrderToPatch :::",idOrderToPatch)

            const dataOrder = this._getModel("ItemsModelSL").getData()
            console.log("dataOrder ::", dataOrder)
            const etatPrep = dataOrder.U_OB1ETATPREP
            const prepared = "P"
            const DocumentLines = this._getModel("DocumentLinesModelSL").getData()
            console.log("DocumentLines ::",DocumentLines)
            const documentLines = DocumentLines.map(doc => ({
                QuantityEntered: doc.QuantityEntered
            }));
            console.log("documentLines ::", documentLines);
            const dataToPatch = {
                U_OB1ETATPREP: prepared,
                DocumentLines:documentLines
            }
            await Models.Orders().patch(dataToPatch, idOrderToPatch);
            console.log(etatPrep)
            console.log(":::::", this._getModel("ItemsModelSL").getData())
            const updatedOrder = await Models.Orders().id(idOrderToPatch).get();
            console.log("updatedOrder :: ", updatedOrder);

            this.getOwnerComponent().getRouter().navTo("PreparationOrderViewPage");

        },


    });
});