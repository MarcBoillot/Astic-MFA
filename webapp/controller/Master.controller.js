sap.ui.define([
    "./BaseController",
    'sap/ui/model/json/JSONModel',
    "sap/m/MessageBox",
    "wwl/utils/Formatter",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    'sap/ui/unified/DateRange',
    'sap/ui/core/format/DateFormat',
    'sap/ui/core/library',
    'sap/ui/core/date/UI5Date',
    "sap/ui/core/routing/History"


], function (
    BaseController,
    JSONModel,
    MessageBox,
    Formatter,
    MessageToast,
    Fragment,
    DateRange,
    DateFormat,
    coreLibrary,
    UI5Date,
    History

) {
    "use strict"
    let Models
    let Views
    let CalendarType = coreLibrary.CalendarType;

    return BaseController.extend("wwl.controller.Master",{
        Formatter: Formatter,
        oFormatYyyymmdd: null,

        onInit: function () {
            Models = this.getOwnerComponent().ConfModel;
            Views = this.getOwnerComponent().ViewsModel;
            this.oFormatYyyymmdd = DateFormat.getInstance({pattern: "yyyy-MM-dd", calendarType: CalendarType.Gregorian});
            this.getOwnerComponent().getRouter()
                .getRoute("Master")
                .attachMatched(this.onRouteMatch, this)

        },

        handleCalendarSelect: function(oEvent) {
            let oCalendar = oEvent.getSource();
            this._updateText(oCalendar);
        },

        _updateText: function(oCalendar) {
            let oText = this.byId("selectedDate"),
                aSelectedDates = oCalendar.getSelectedDates(),
                oDate = aSelectedDates[0].getStartDate();

            oText.setText(this.oFormatYyyymmdd.format(oDate));
        },

        handleSelectToday: function() {
            let oCalendar = this.byId("calendar");

            oCalendar.removeAllSelectedDates();
            oCalendar.addSelectedDate(new DateRange({startDate: UI5Date.getInstance()}));
            this._updateText(oCalendar);
        },

        onRouteMatch: async function () {
            const order = await Models.Orders().top(5).get()
            const item = await Models.Items().top(5).get()

            let formattedOrders = []
            order.value.forEach((order => {
                formattedOrders.push({
                    key1: order.DocNum,
                    key2: order.DocEntry,
                    key3: order.DocumentLines
                })
            }))

            console.log("formattedOrders ::", formattedOrders)
            this._setModel(order.value, "ordersModel")
            this._setModel(item.value, "itemsModel")
            let totalPrice = this.calculiSommePrice(Models.Items().top(5).get())
            console.log(totalPrice);
            console.log(this._getModel("itemsModel").getData());
            console.log(this._getModel("ordersModel").getData());

            // /** Exemple d'une vue SQL **/
            // const transferRequest = await Views.getTransferRequests()
            // console.log("transferRequest ::", transferRequest)

            // /** Exemple d'une 'SQLQueries' **/
            // const itemsInSpecificBinLocation = await Models.SQLQueries().get('getItemsFromSpecificBinLocation', "?BinCode='M1-M0-PL1'")
            // console.log("itemsInSpecificBinLocation ::", itemsInSpecificBinLocation.value)
        },

        onOrdersView: function (oEvent) {

            // let currentPage = that.getOwnerComponent().getRouter().oHashChanger._oActiveRouter._oMatchedRoute._oConfig.name
            // this.handleViewOnNavigation()
            this.getOwnerComponent().getRouter().navTo('OrdersTable')

            // Models = this.getOwnerComponent().ConfModel;
            // Views = this.getOwnerComponent().ViewsModel;
            // this.getOwnerComponent().getRouter()
            //     .getRoute("OrdersView")
            // let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            // oRouter.navTo("OrdersTable");
        },

        onCollapseAll: function () {
            const oTreeTable = this._byId("treeTable")
            // let allOrders = Models.Orders().top(2).get()
            // this._setModel(allOrders.value,"ordersModel");
            oTreeTable.collapseAll();
        },

        onCollapseSelection: function () {
            const oTreeTable = this._byId("treeTable")
            // let oTreeTable = Models.Orders().top(2).get()
            // this._setModel(oTreeTable.value, "ordersModel");
            oTreeTable.collapse(oTreeTable.getSelectedIndices());
        },

        onExpandFirstLevel: function () {
            const oTreeTable = this._byId("treeTable")
            // let oTreeTable = Models.Orders().top(2).get()
            // this._setModel(oTreeTable.value, "ordersModel");
            oTreeTable.expandToLevel(1);
        },

        onExpandSelection: function () {
            const oTreeTable = this._byId("treeTable")
            // let oTreeTable = Models.Orders().top(2).get()
            // this._setModel(oTreeTable.value, "ordersModel");
            oTreeTable.expand(oTreeTable.getSelectedIndices());
        },

        getDetails: function (oEvent) {

            const selectedRow = oEvent.getSource().oPropagatedProperties.oBindingContexts.ordersModel.getObject()
            Fragment.load({})

        },

        onPress: function () {
            // pour stocker la view principale et pour éviter qu'elle se perde (problème de scope)
            let that = this

            if (!this._byId("helloDialog")) {
                this._oDialogDetail = Fragment.load({
                    // id: this.oView.getId(),
                    name: "wwl.view.Menu",
                    controller: this
                }).then(function (oMenu) {
                    console.log("this ::", that)
                    that.oView.addDependent(oMenu);
                    oMenu.attachAfterClose(() => oMenu.destroy())
                    oMenu.getEndButton(function (){
                        oMenu.close()
                    })
                    oMenu.open();
                });
            } else {
                this._oDialogDetail.then(function (oDialog){
                    oDialog.open();
                })
            }
        },


        // open: function() {
        //    let oView = this._oView;
        //    if(!oView.byId("helloDialog")){
        //        let oFragmentController = {
        //            onCloseDialog: function(){
        //                oView.byId("helloDialog").close();
        //            }
        //        }
        //
        //        Fragment.load({
        //            id: oView.getId(),
        //            name: "wwl.view.Menu",
        //            controller: oFragmentController
        //        }).then(function (oDialog) {
        //            oView.addDependent(oDialog);
        //            oDialog.open();
        //        })
        //    } else{
        //        oView.byId("helloDialog").open();
        //    }
        //
        // },

        onMenuAction: function (oEvent) {
            let oItem = oEvent.getParameter("item"),
                sItemPath = "";

            while (oItem instanceof MenuItem) {
                sItemPath = oItem.getText() + " > " + sItemPath;
                oItem = oItem.getParent();
            }

            sItemPath = sItemPath.substr(0, sItemPath.lastIndexOf(" > "));

            MessageToast.show("Action triggered on item: " + sItemPath);
        },

        calculiSommePrice: function (itemPriceData) {
            let somme = 0;
            for (let i = 0; i < itemPriceData.length; i++) {
                somme += itemPriceData[i].prix;
            }
            return itemPriceData;
        },
        onClose: function() {
            this._byId("helloDialog").close();
        }

    });
});