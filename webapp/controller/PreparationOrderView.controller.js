sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "wwl/utils/Formatter"
], function (BaseController, JSONModel, Fragment,Formatter) {
    "use strict";
    let Models
    let Views

    return BaseController.extend("wwl.controller.PreparationOrderView", {
        Formatter: Formatter,

        onInit: async function () {
            Models = this.getOwnerComponent().ConfModel;
            Views = this.getOwnerComponent().ViewsModel;
            this.getOwnerComponent().getRouter()
                .getRoute("PreparationOrderViewPage")
                .attachMatched(this.onRouteMatch, this);
        },

        onRouteMatch:async function(){
            const orders = await Models.Orders().filter("DocumentStatus ne 'bost_Close'").orderby('DocDueDate desc').get();
            this._setModel(orders.value,"OrdersModelSL");
            console.log("orders ::",orders.value)
        },

        onPressMasterPage: function (){
            this.getOwnerComponent().getRouter().navTo("Master");
        },

        onPressSortByMat: async function(){
            const listOfMatOrder = await Models.Orders().filter(`DocumentStatus ne 'bost_Close' and U_OB1TYPCDE eq '2'`).get();
            this._setModel(listOfMatOrder.value, "OrdersModelSL");
            this._getModel("OrdersModelSL").refresh(true);
            console.log(listOfMatOrder)
            return listOfMatOrder
        },

        onPressSortByAccess:async function(event){
            const listOfAccessOrder = await Models.Orders().filter(`DocumentStatus ne 'bost_Close' and U_OB1TYPCDE eq '1'`).get();
            this._setModel(listOfAccessOrder.value, "OrdersModelSL");
            this._getModel("OrdersModelSL").refresh(true);
            console.log(listOfAccessOrder)
            return listOfAccessOrder
        },

        onPressShowItemsInOfSL:async function (event){
            const clickEvent = event.getSource();
            const bindingContext = clickEvent.getBindingContext("OrdersModelSL");
            const oModel = bindingContext.getModel();
            console.log("oModel ::",oModel)
            const dataOrder = oModel.getData()
            console.log("dataOrder ::",dataOrder)
            const sPath = bindingContext.getPath();
            const etatPrep = oModel.getProperty(sPath + "/U_OB1ETATPREP");
            console.log("etatPrep ::",etatPrep)
            if(etatPrep === "NP"){
                const selectedOrder = event.getSource().getBindingContext("OrdersModelSL").getObject()
                const DocEntry = selectedOrder.DocEntry
                console.log("DocEntry of selected Order ::",DocEntry)
                this.getOwnerComponent().getRouter().navTo("PreparationItemsViewPage", {
                    DocEntry: DocEntry
                });
            }else{
                console.log("ERREUR COMMANDE DEJA VALIDE")
            }


        },

    });
});
