sap.ui.define([
    "./BaseController",
    'sap/ui/model/json/JSONModel',
    "sap/ui/core/Fragment"
], function (BaseController, Fragment) {
    "use strict";

    let Models, Views;

    return BaseController.extend("wwl.controller.ManagerStocksSelectItem", {


        onInit: function () {
            Models = this.getOwnerComponent().ConfModel;
            Views = this.getOwnerComponent().ViewsModel;
            this.getOwnerComponent().getRouter()
                .getRoute("ManagerStocksSelectItemPage")
                .attachMatched(this.onRouteMatch, this);
        },

        onRouteMatch: async function () {

        },

        onPressMasterView: async function () {
            this.getOwnerComponent().getRouter().navTo("Master");
        },

        onPressManagerSelectItems: async function () {
            const itemCode = this._getModel("ItemCodeModelSL").getData().ItemCode
            this.getOwnerComponent().getRouter().navTo("ManagerStocksItemViewPage",{
                ItemCode:itemCode
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

        showListOfItemsName: async function (event) {
            const input = event.getSource().getValue()
            const inputToUpperCase = input.toUpperCase()
            const nbCharSup = this.controllerCharNumber(event)
            let haveSelectedItem = false
            if (nbCharSup === true && haveSelectedItem === false) {
                const ListOfItemsFiltered = await Models.Items().filter(`Frozen ne 'tYES' and contains(ItemName,'${inputToUpperCase}')`).get();
                this._setModel(ListOfItemsFiltered.value, "StockItemsListModelSL");
            }
            haveSelectedItem = true
        },


        selectedItemName: async function (event) {
            const selectedItem = event.getSource().getSelectedKey()
            const itemWithItemName = this._setModel([], "itemModelSL")
            this._setModel(itemWithItemName.ItemCode, "itemWithItemNameModelSL")
            this._setModel({ItemCode: selectedItem}, "ItemCodeModelSL")
            await this.onPressManagerSelectItems()
        },

        showListOfItemsCode: async function (event) {
            const input = event.getSource().getValue()
            const ListOfItemsFiltered = await Models.Items().filter(`Frozen ne 'tYES' and contains(ItemCode,'${input}')`).get();
            this._setModel(ListOfItemsFiltered.value, "StockItemsListModelSL");
        },

        selectedItemCode: async function (event) {
            const selectedItem = event.getSource().getSelectedKey()
            const itemWithItemCode = this._setModel([], "itemModelSL")
            this._setModel(itemWithItemCode.ItemCode, "itemWithItemCodeModelSL")
            this._setModel({ItemCode: selectedItem}, "ItemCodeModelSL")
            await this.onPressManagerSelectItems()
        },


    });
});


