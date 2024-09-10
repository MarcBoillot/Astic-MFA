sap.ui.define([
    "./BaseController",
    'sap/ui/model/json/JSONModel',
    "sap/ui/core/Fragment",
    "wwl/utils/Formatter"
], function (BaseController,JSONModel,Fragment,Formatter) {
    "use strict";

    let Models, Views;

    return BaseController.extend("wwl.controller.ReceptionChoiceList", {
        Formatter: Formatter,
        onInit: function () {
            Models = this.getOwnerComponent().ConfModel;
            Views = this.getOwnerComponent().ViewsModel;
            this.getOwnerComponent().getRouter()
                .getRoute("ReceptionChoiceListPage")
                .attachMatched(this.onRouteMatch, this);
        },

        onRouteMatch: async function () {
            const drafts = await Models.Drafts().orderby("DocDate desc").filter("DocumentStatus eq 'bost_Open'").get();
            console.log("drafts :::",drafts.value)
            this._setModel(drafts.value, "ReceptionsModelSL");
            this._getModel("ReceptionsModelSL").refresh(true);
            const draftValue = drafts.value;
        },


        onPressReceptionChoicePage: function () {
            this.getOwnerComponent().getRouter().navTo("ReceptionChoicePage");
        },

    });
});