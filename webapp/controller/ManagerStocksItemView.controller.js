sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment"
], function (BaseController, JSONModel, Fragment) {
    "use strict";
    let Models
    let Views

    return BaseController.extend("wwl.controller.ManagerStocksItemView", {

        onPressStocksSelectItemPage: async function () {
            this.getOwnerComponent().getRouter().navTo("ManagerStocksSelectItemPage");
        },


        onInit: function () {
            Models = this.getOwnerComponent().ConfModel;
            Views = this.getOwnerComponent().ViewsModel;
            this.getOwnerComponent().getRouter()
                .getRoute("ManagerStocksItemViewPage")
                .attachMatched(this.onRouteMatch, this);
        },

        onRouteMatch: async function (oEvent) {
            const ItemCode = oEvent.getParameter("arguments").ItemCode
            this._setModel({ItemCode: ItemCode}, "ItemCodeModelSL")
            const ItemSelectedModelSL = await Models.Items().filter(`Frozen ne 'tYES' and contains(ItemCode,'${ItemCode}')`).get()

            // test stock sur le whs 01 voir si besoin stock global
            const dataItemSelected = ItemSelectedModelSL.value[0]
            const itemStockOrdered = dataItemSelected.ItemWarehouseInfoCollection[0].Ordered
            const itemInStock = dataItemSelected.ItemWarehouseInfoCollection[0].InStock
            const itemCommitted = dataItemSelected.ItemWarehouseInfoCollection[0].Committed
            const stockDispo = this.calculateStockDispo(itemInStock, itemCommitted, itemStockOrdered)
            dataItemSelected.stockDispo = stockDispo;
            this._setModel(dataItemSelected, "ItemModelSL");
            this._getModel("ItemModelSL").refresh(true);

            this._setModel(ItemSelectedModelSL.value[0], "ItemModelSL")
            console.log(this._getModel("ItemModelSL").getData().ItemWarehouseInfoCollection[0])
            this._getModel("ItemModelSL").refresh(true);
        },

        calculateStockDispo: function(stock,stockCommitted,stockOrdered){
            let result = stock - stockCommitted + stockOrdered
            return result
        },

        onPressWhs:async function (){

            const WarehouseCode =   await this._getModel("ItemModelSL").getData().ItemWarehouseInfoCollection[0].WarehouseCode
            console.log("WarehouseCode ::",WarehouseCode)
            const LabelBox = new sap.m.Label({text: "Warehouse: " + `${WarehouseCode}`})
            let HboxWhs = new sap.m.VBox({
                items: [LabelBox],
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


        serialNumManager:function (){
            const dataItem = this._getModel("ItemModelSL").getData()
            const ManageSerialNumbers = dataItem.ManageSerialNumbers
            console.log(dataItem)
            console.log(ManageSerialNumbers)
            //
            if(ManageSerialNumbers === 'tNO'){
                new sap.m.MessageBox.error("Aucun numero de série")
                // let text = new sap.m.Text({text:`${serialNum}`})
            }else{
                // dataItem.SerialNumbers.forEach(line=>{line.SerialNum})
                new sap.m.MessageBox.success("Possède un numéro de Série")
                console.log("???")
            }
        },

        onPressPrintCodeBars: function () {
            const barCode = this._getModel("ItemModelSL").getData().BarCode
            if (barCode === null) {
                let text = new sap.m.Text({text: "Aucun code barre"})
                let dialog = new sap.m.Dialog({
                    title: "Impression code barre",
                    content: text,
                    contentWidth: "300px",
                    endButton: new sap.m.Button({
                        text: "Fermer",
                        press: function () {
                            dialog.close()
                        }
                    })
                })
                dialog.open()
                console.log("il n'y a pas de code barre")
            } else {
                let text = new sap.m.Text({text: `Imprimer le code barre : ${barCode}`}).addStyleClass("sapUiSmallMargin");
                let labelInput = new sap.m.Label({text:"Quantité"}).addStyleClass("sapUiSmallMargin");
                let input = new sap.m.Input({width:"100px"}).addStyleClass("sapUiSmallMargin");

                let dialog = new sap.m.Dialog({
                    title: "Impression code barre",
                    content: [text,labelInput,input],
                    contentWidth: "300px",
                    endButton: new sap.m.Button({
                        text: "Valider",
                        press: async function () {
                            const inputValue = input.getValue()
                            const dataToPost = {
                                "Id":100,
                                "FileName":`${barCode}.PDF`,
                                "NbImpression": inputValue,
                                "EditionParameters":{
                                    "ItemCode@":`${barCode}`
                                }
                            }
                            //probleme nombre d'impressions
                            for(let x=0;x != inputValue;x++){
                                await Models.PrintAPI().print(dataToPost)
                            }

                            console.log("Code barre imprimé")
                            dialog.close()
                        }
                    })
                })
                dialog.open()
            }
        },



        onPressToAddCodeBars:async function () {
            let that = this
            const ItemCode = this._getModel("ItemCodeModelSL").getData().ItemCode
            const barCode = this._getModel("ItemModelSL").getData().BarCode
            if (barCode === null) {
                let input = new sap.m.Input({enabled:false ,value: ItemCode})
                let oDialog = new sap.m.Dialog({
                    title: "Code Barre",
                    content: input,
                    contentWidth: "300px",
                    endButton: new sap.m.Button({
                        text: "Retour",
                        press: function () {
                            oDialog.close()
                        }
                    }),
                    beginButton: new sap.m.Button({
                        text: "Valider",
                        press: async function () {
                            let codeBars = input.getValue()
                            let idItem = that._getModel("ItemModelSL").getData().ItemCode
                            await Models.Items().patch({BarCode: codeBars}, `'${idItem}'`, true)
                            console.log("code barre ajouté")
                            //refresh la page
                            await that.refreshItemModelSL(idItem);
                            oDialog.close()
                        }

                    }),
                });
                oDialog.open()
                let idItem = that._getModel("ItemModelSL").getData().ItemCode
                await this.refreshItemModelSL(idItem)
            } else {
                //si code barre existant creation d'un nouveau code barre frs
                new sap.m.MessageBox.warning("Code barre existant voulez vous quand meme ajouter un code barre Frs?", {
                    actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
                    onClose: function (oAction) {
                        if (oAction === sap.m.MessageBox.Action.OK) {
                            let input = new sap.m.Input()
                            let dialog = new sap.m.Dialog({
                                title: "Ajout code bars fournisseur",
                                content: input,
                                contentWidth: "300px",
                                beginButton: new sap.m.Button({
                                    text: "valider",
                                    press: async function () {
                                        let codeBars = input.getValue()
                                        let dataToPost = {
                                            AbsEntry: 1,
                                            Barcode: codeBars,
                                            FreeText: "CdeBar Frs",
                                            ItemNo: ItemCode,
                                            UoMEntry: -1
                                        }
                                        const getCodeBars = await Models.BarCodes().filter(`FreeText eq 'CdeBar Frs' and ItemNo eq '${ItemCode}'`).get()
                                        const designationCodeBars = getCodeBars.value[0].FreeText
                                        if (designationCodeBars === "CdeBar Frs") {
                                            new sap.m.MessageBox.error("Code Barre Frs existant")
                                            console.log("code barre frs existe deja :::", getCodeBars)
                                        } else {
                                            await Models.BarCodes().post(dataToPost)
                                            console.log("code barre créé :: ", dataToPost)
                                        }
                                        dialog.close()
                                    }
                                }),
                                endButton: new sap.m.Button({
                                    text: "Retour",
                                    press: function () {
                                        dialog.close()
                                    }
                                }),
                            })
                            dialog.open()
                        }
                    }
                })

            }
        },

        refreshItemModelSL: async function (idItem) {
            const updatedItemData = await Models.Items().filter(`ItemCode eq '${idItem}'`).get();
            this._setModel(updatedItemData.value[0], "ItemModelSL");
            this._getModel("ItemModelSL").refresh(true);
        },


        onPressDetailsStock: function (event) {
            const selectedOrder = event.getSource().getBindingContext("itemsModelSL").getObject();
            const documentLines = selectedOrder.DocumentLines || [];
            console.log(documentLines);

            let oTable = new sap.m.Table({
                mode: sap.m.ListMode.None,
                columns: [
                    new sap.m.Column({header: new sap.m.Text({text: "Emplacement"})}),
                    new sap.m.Column({header: new sap.m.Text({text: "Quantité"})}),
                    new sap.m.Column({header: new sap.m.Text({text: "Quantité réservée"})})
                ]
            });

            documentLines.forEach(line => {
                let oColumnListItem = new sap.m.ColumnListItem();
                oColumnListItem.addCell(new sap.m.Text({text: line.ItemCode}));
                oColumnListItem.addCell(new sap.m.Text({text: line.Quantity}));
                oColumnListItem.addCell(new sap.m.Text({text: line.Quantity}));
                oTable.addItem(oColumnListItem);
            });

            let dialog = new sap.m.Dialog({
                title: "BL détails",
                content: [oTable],
                contentWidth: "900px",
                // endButton: new sap.m.Button({
                //     text: "Fermer",
                //     press: function () {
                //         dialog.close();
                //     }
                // })
            });
            dialog.open();
        }
    });
});
