sap.ui.define([
    "./BaseController",
    'sap/ui/model/json/JSONModel',
    "sap/ui/core/Fragment"
], function (BaseController) {
    "use strict";

    let Models, Views;

    return BaseController.extend("wwl.controller.Master", {

        onPressReceptionChoicePage: function () {
            this.getOwnerComponent().getRouter().navTo("ReceptionChoicePage");
        },

        onPressManagerStocksSelectItemPage:function (){
            this.getOwnerComponent().getRouter().navTo("ManagerStocksSelectItemPage");
        },

        onPressPreparationOrderViewPage: function(){
            this.getOwnerComponent().getRouter().navTo("PreparationOrderViewPage");
        },

        onPressControlPreparationListPage: function(){
            this.getOwnerComponent().getRouter().navTo("ControlPreparationListPage");
        },


        onInit: function () {
            Models = this.getOwnerComponent().ConfModel;
            Views = this.getOwnerComponent().ViewsModel;
            this.getOwnerComponent().getRouter()
                .getRoute("Master")
                .attachMatched(this.onRouteMatch, this);
        },

        onRouteMatch: async function () {
            // const getRequestForOrders = await Views.getItems()
            // this._setModel(getRequestForOrders, "ordersModelSQL");
            // console.log("orders ::", getRequestForOrders)

            // Exemple d'une vue SQL
            // const transferRequest = await Views.getTransferRequests();
            // console.log("transferRequest ::", transferRequest);

            // Exemple d'une 'SQLQueries'
            // const itemsInSpecificBinLocation = await Models.SQLQueries().get('getItemsFromSpecificBinLocation', "?BinCode='M1-M0-PL1'");
            // console.log("itemsInSpecificBinLocation ::", itemsInSpecificBinLocation.value);
        }
    });
});
