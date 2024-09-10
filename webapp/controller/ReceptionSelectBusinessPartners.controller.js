sap.ui.define([
    "./BaseController",
    'sap/ui/model/json/JSONModel',
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
], function (BaseController, JSONModel, Fragment, MessageBox) {
    "use strict";

    let Models, Views;

    return BaseController.extend("wwl.controller.ReceptionSelectBusinessPartners", {

        onInit: function () {
            Models = this.getOwnerComponent().ConfModel;
            Views = this.getOwnerComponent().ViewsModel;
            this.getOwnerComponent().getRouter()
                .getRoute("ReceptionSelectBusinessPartnersPage")
                .attachMatched(this.onRouteMatch, this);
        },

        onRouteMatch: async function () {

        },

        dialogForCreation:function(){
            let text = new sap.m.Text({text:"Vous-voulez créer une reception ?"})
            let dialog = new sap.m.Dialog({
                title: "CREATION RECEPTION",
                content:text,
                contentWidth: "300px",
                beginButton: new sap.m.Button({
                    text:"Voir liste draft",
                    press:function(){
                        console.log("voir la liste des drafts")
                        dialog.close()
                    }
                }),
                endButton: new sap.m.Button({
                    text:"Oui",
                    press:function(){
                        console.log("continuer vers selection articles")
                        dialog.close()
                    }
                })
            })
            dialog.open()
        },

        onPressReceptionChoicePage:
            function () {
                this.getOwnerComponent().getRouter().navTo("ReceptionChoicePage");
            },

        onPressReceptionSelectBusinessPartners: async function () {
            const cardCode = this._getModel("ReceptionSuppliersListModelSL").getData()[0].CardCode
            this.getOwnerComponent().getRouter().navTo("ReceptionSelectItemPage", {
                CardCode: cardCode
            });
        },

        controllerCharNumber: function (event) {
            const input = event.getParameters().value
            let nbCharSup = false
            if (input.length >= 4) {
                nbCharSup = true
            }
            return nbCharSup
        },

        showListOfSuppliers: async function (event) {
            console.log(event.getParameters().value.toUpperCase())
            const input = event.getSource().getValue()
            const inputToUpperCase = input.toUpperCase()
            const nbCharSup = this.controllerCharNumber(event)
            let haveSelectedBp = false
            if (nbCharSup === true && haveSelectedBp === false) {
                console.log("il y a plus de 3 char ::", nbCharSup)
                const ListOfSuppliersFiltered = await Models.BusinessPartners().filter(`Frozen ne 'tYES' and CardType eq 'S' and contains(CardName,'${inputToUpperCase}')`).get();
                console.log("List of suppliers filtered ::", ListOfSuppliersFiltered.value)
                this._setModel(ListOfSuppliersFiltered.value, "ReceptionSuppliersListModelSL");
            }
            haveSelectedBp = true
        },

        selectedSupplierWithCardName: async function (event) {
            let that = this
            const selectedBpBool = true
            const selectedSupplier = event.getSource().getSelectedKey()
            const modelDraft = this._setModel([], "draftModelSL");
            this._setModel(modelDraft.CardName, "inputCardName");
            console.log("Fournisseur sélectionné", selectedSupplier)
            await that.onPressReceptionSelectBusinessPartners();
            return selectedBpBool
        },

        showListOfSuppliersWithCardCode: async function (event) {
            console.log(event.getParameters().value.toUpperCase())
            const input = event.getSource().getValue()
            const nbCharSup = this.controllerCharNumber(event)
            let haveSelectedBp = false
            if (nbCharSup === true && haveSelectedBp === false) {
                console.log("il y a plus de 3 char ::", nbCharSup)
                const ListOfSuppliersFiltered = await Models.BusinessPartners().filter(`Frozen ne 'tYES' and CardType eq 'S' and contains(CardCode,'${input}')`).get();
                console.log("List of suppliers filtered ::", ListOfSuppliersFiltered.value)
                this._setModel(ListOfSuppliersFiltered.value, "ReceptionSuppliersListModelSL");
            }
            haveSelectedBp = true
        },

        selectedSupplierWithCardCode: async function (event) {
            const selectedBpBool = true
            const selectedSupplier = event.getSource().getSelectedKey()
            const modelDraft = this._setModel([], "draftModelSL");
            this._setModel(modelDraft.CardCode, "inputCardCode");
            console.log("Fournisseur sélectionné", selectedSupplier);
            await this.onPressReceptionSelectBusinessPartners();
            this.dialogForCreation()
            return selectedBpBool

        },
    });
});





