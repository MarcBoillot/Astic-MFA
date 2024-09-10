sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "wwl/model/models",
    "wwl/model/ConfModel",
    "wwl/model/Views"

], function (
    UIComponent,
    Device,
    models,
    ConfModel,
    ViewsModel
) {
    "use strict";

    return UIComponent.extend("wwl.Component", {

        metadata: {
            manifest: "json"
        },

        init: async function () {
            UIComponent.prototype.init.apply(this, arguments);

            this.APP_CONTEXT = {
                authRequired: true,
                dbCompany: 'SBO_ASTIC_TSTAPI',
                url: {
                    XSODATA: 'https://sapslr.materiel-forestier.fr:4300/OB1_VIEW_XS_STOCK_MANAGER_TEST/',
                    SL: 'https://sapslr.materiel-forestier.fr:50000/b1s/v1/',
                    PrintAPI: 'https://sap.materiel-forestier.fr:2660/api/Print',
                    // PrintAPI: 'https://sap.materiel-forestier.fr:2660/api/ExportPDF',
                    SeidorAPI: 'https://sap.materiel-forestier.fr:2662/api/ExecuteQuery'
                },
            };

            this.setModel(models.createDeviceModel(), "device");
            this.ConfModel = new ConfModel(this.getRootControl());
            this.ViewsModel = new ViewsModel(this.getRootControl());

            this.getRouter().initialize();
        },

    });

});