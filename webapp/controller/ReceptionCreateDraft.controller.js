sap.ui.define([
    "./BaseController",
    'sap/ui/model/json/JSONModel',
    "sap/ui/core/Fragment"
], function (BaseController, Fragment) {
    "use strict";

    let Models, Views;

    return BaseController.extend("wwl.controller.ReceptionCreateDraft", {


        onInit: function () {
            Models = this.getOwnerComponent().ConfModel;
            Views = this.getOwnerComponent().ViewsModel;
            this.getOwnerComponent().getRouter()
                .getRoute("ReceptionCreateDraftPage")
                .attachMatched(this.onRouteMatch, this);
        },

        onRouteMatch: async function (oEvent) {
            const DocEntry = oEvent.getParameter("arguments").DocEntry;
            const ItemCode = oEvent.getParameter("arguments").ItemCode;
            this._setModel({DocEntry: DocEntry}, "DocEntryModelSL")
            this._setModel({ItemCode: ItemCode}, "ItemCodeModelSL")
            await this.itemInformations()
        },

        onPressReceptionSelectItemPage:async function () {
            const DocEntry = await this._getModel("DocEntryModelSL").getData().DocEntry
            this.getOwnerComponent().getRouter().navTo("ReceptionSelectItemPage",{
                DocEntry: DocEntry
            });
        },

        //recupêration du draft créé avec son docentry et creation d'un model
        draftInformations:async function () {
            const DocEntry = this._getModel("DocEntryModelSL").getData().DocEntry
            const DraftSelectedModelSL = await Models.Drafts().filter(`contains(DocEntry,'${DocEntry}')`).get()
            this._setModel(DraftSelectedModelSL.value[0], "DraftModelSL")
            console.log("verify draft model ::::",this._getModel("DraftModelSL").getData())
            this._getModel("DraftModelSL").refresh(true);
        },

        //recupération de l'article sélectionné avec son itemcode et creation d'un model
        itemInformations: async function () {
            await this.draftInformations()
            const ItemCode = this._getModel("ItemCodeModelSL").getData().ItemCode
            const ItemSelectedModelSL = await Models.Items().filter(`Frozen ne 'tYES' and contains(ItemCode,'${ItemCode}')`).get()
            this._setModel( ItemSelectedModelSL.value[0],"ItemModelSL")
            console.log("itemModelSL :::",this._getModel("ItemModelSL").getData())
            this._getModel("ItemModelSL").refresh(true);
        },


        //fonction pour recuperation le numero de serie par l'input
        serialNumbersManager:function(){

        },

        //function pour patch les données de l'article au preenregistrement
        onPressCreateDraft: async function (event) {
            const ModelsData = this._getModel("ItemModelSL").getData()

            // const codebars = this._getModel("ItemCodeModelSL").getData().CodeBars
            // const itemName = this._getModel("ItemCodeModelSL").getData().ItemName
            const idDraft = this._getModel("DocEntryModelSL").getData().DocEntry
            //recuperation des valeurs des input pour patch
            const Quantity = event.getSource().getModel("ItemModelSL")
            console.log("Quantity ::",Quantity)
            const dataToPatch = {
                ModelsData:ModelsData,
                Quantity: Quantity,
                SerialNum: serialNumber,
                Whs: whs
            }
            console.log("datato patch ::",dataToPatch)
            // Models.Drafts().patch(dataToPatch, idDraft)
            //     .then(() => {
            //         console.log("Patch réussi sur le draft :",idDraft);
            //     }).catch((error) => {
            //     console.error("Erreur lors de la mise à jour du Draft", error);
            // });
            let updatedDraft = await Models.Drafts().id(idDraft).get();
            this._setModel(updatedDraft, 'DraftModelSL');
        },

        //function pour gérer le stockage quand il n'est pas défini
        onPressNewWhs:function (event){
            let labelWhs = new sap.m.Label({text: "Entrez ue zone de stockage"}).addStyleClass("sapUiSmallMargin");
            let inputWhs = new sap.m.Input({placeholder: "Zone de stockage"});
            let HboxWhs = new sap.m.HBox({
                items: [labelWhs, inputWhs],
                alignItems: "Center"
            }).addStyleClass("sapUiSmallMargin");

            let dialog = new sap.m.Dialog({
                title: "Entrer une zone de stockage",
                content: [HboxWhs],
                beginButton: new sap.m.Button({
                    text: "Valider",
                    press: () => {

                        dialog.close();
                    }
                }),
                endButton: new sap.m.Button({
                    text: "Close",
                    press: () => {
                        dialog.close();
                    }
                })
            });
            dialog.open();
        }

    });
});






