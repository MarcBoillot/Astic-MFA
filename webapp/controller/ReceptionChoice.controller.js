sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment"
], function (BaseController) {
    "use strict";
    let Models;
    let Views;

    return BaseController.extend("wwl.controller.ReceptionChoice", {

        onInit: async function () {
            Models = this.getOwnerComponent().ConfModel;
            Views = this.getOwnerComponent().ViewsModel;
            this.getOwnerComponent().getRouter()
                .getRoute("ReceptionChoicePage")
                .attachMatched(this.onRouteMatch, this);
        },

        onRouteMatch: async function () {

        },

        onPressAccueil: function (){
            this.getOwnerComponent().getRouter().navTo("Master")
        },

        onPressReceptionChoiceList: function (){
            this.getOwnerComponent().getRouter().navTo("ReceptionChoiceListPage");
        },

        onPressReceptionSelectBusinessPartners: function (){
            this.getOwnerComponent().getRouter().navTo("ReceptionSelectBusinessPartnersPage")
        },








        onPressSelectItemForReception: function () {
            this.getOwnerComponent().getRouter().navTo("SelectItemForReception");
        },

        onChangeSelectionItem: async function (event) {
            const items = await Models.Items().top(50).get();
            this._setModel(items.value, "itemsModelSL");
            console.log("itemsModelSL- ::", items.value);

            this._setModel({}, "item");
            const draftModel = this._getModel("draftModelSL");
            //test voir si draft model exist
            if (!draftModel) {
                console.error("draftModelSL is not defined");
                return;
            }
            const draftData = draftModel.getData();
            console.log("draftModel :: ", draftData);
            const idDraftToPatch = draftData.DocEntry;

            //test voir si je recup le docEntry
            if (!idDraftToPatch) {
                console.error("DocEntry is not defined in draftModel");
                return;
            }
            console.log("idDraftToPatch :: ", idDraftToPatch);
            this._setModel({DocEntry: idDraftToPatch}, "draftModelSL");
            const input = event.getSource();
            const selectedItem = input.getSelectedKey();
            if (selectedItem) {
                const dataToPatch = {
                    DocumentLines: [
                        {
                            ItemCode: selectedItem
                        }
                    ]
                };
                try {
                    await Models.Drafts().patch(dataToPatch, idDraftToPatch);
                    console.log("PATCH successful");

                    const updatedDraft = await Models.Drafts().id(idDraftToPatch).get();
                    console.log("updatedOrder :: ", updatedDraft);
                } catch (error) {
                    console.error("PATCH failed", error);
                }
            }
        },

        onPressDetailsOnReceipt: async function (event) {
            const receiptItems = await Models.Drafts().top(20).get();
            const itemsOfReceipt = receiptItems.value.DocumentLines;
            console.log("receiptItems ::", itemsOfReceipt);

            const selectedPurchaseDeliveryNotes = event.getSource().getBindingContext("ReceptionsModelSL").getObject();
            const documentLines = selectedPurchaseDeliveryNotes.DocumentLines;
            console.log("documentLines ::", documentLines);
        }

    });
});
