sap.ui.define([
    "./BaseController",
    'sap/ui/model/json/JSONModel',
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "wwl/utils/Formatter"
], function (BaseController, JSONModel, Fragment, MessageBox, Formatter) {
    "use strict";

    let Models, Views;

    return BaseController.extend("wwl.controller.ReceptionSelectPurchaseOrder", {

        Formatter: Formatter,
        onInit: function () {
            Models = this.getOwnerComponent().ConfModel;
            Views = this.getOwnerComponent().ViewsModel;
            this.getOwnerComponent().getRouter()
                .getRoute("ReceptionSelectPurchaseOrderPage")
                .attachMatched(this.onRouteMatch, this);
        },

        onRouteMatch: async function (oEvent) {
            const ItemCode = oEvent.getParameter("arguments").ItemCode;
            const CardCode = oEvent.getParameter("arguments").CardCode;
            this._setModel({draftExist: false, selectedItemCode: ItemCode, CardCode: CardCode}, "draftModel")
            await this.managerQtyDraft()
        },

        onPressNewDraft: function () {
            this.getOwnerComponent().getRouter().navTo("ReceptionSelectBusinessPartnersPage");
        },

        dialogListPurchaseOrder: async function () {
            let that = this
            const draftData = this._getModel("draftModel").getData()

            const purchaseOrderDataResult = await Views.getView(`getPurchaseOrder_parameters(itemCode='${draftData.selectedItemCode}',cardCode='${draftData.CardCode}')/Results`)
            const purchaseOrderData = purchaseOrderDataResult.d.results
            console.log("purchaseOrderData ::", purchaseOrderData)
            let purchaseOrderModel = new JSONModel(purchaseOrderData)
            let titleTable = new sap.m.Title({titleStyle: "H3", text: "Liste des commandes"})
            let HboxTitleTable = new sap.m.HBox({
                items: titleTable,
                justifyContent: "Center"
            }).addStyleClass("sapUiTinyMargin")
            let purchaseOrderTable = new sap.m.Table({
                alternateRowColors: true,
                mode: "MultiSelect",
                selectionChange: (oEvent) => this.onSelectChange(oEvent),
                columns: [
                    new sap.m.Column({
                        header: new sap.m.Text({text: "DocNum"})
                    }),
                    new sap.m.Column({hAlign: "End", header: new sap.m.Text({text: "DocEntry"})}),
                    new sap.m.Column({hAlign: "End", header: new sap.m.Text({text: "FormattedDocDueDate"})}),
                    new sap.m.Column({hAlign: "End", header: new sap.m.Text({text: "RemainingQty"})})
                ],
                items: {
                    path: "/",
                    template: new sap.m.ColumnListItem({
                        cells: [
                            new sap.m.Text(
                                {text: "{DocNum}"}
                            ),
                            new sap.m.Text(
                                {text: "{DocEntry}"}
                            ), new sap.m.Text(
                                {text: "{FormattedDocDueDate}"}
                            ), new sap.m.Text(
                                {text: "{RemainingQty}"}
                            )
                        ]
                    })
                }
            })
            purchaseOrderTable.setModel(purchaseOrderModel)
            let purchaseOrderDialog = new sap.m.Dialog({
                content: [HboxTitleTable, purchaseOrderTable],
                showHeader: false,
                beginButton: new sap.m.Button({
                    text: "Retour",
                    press: () => purchaseOrderDialog.close()
                }),
                endButton: new sap.m.Button({
                    text: "Valider",
                    type: "Success",
                    press: async () => {
                        that.managerDrafts(draftData.draftExist)
                        purchaseOrderDialog.close()
                    }
                })
            });
            purchaseOrderDialog.open();
        },

        onSelectChange: function (oEvent) {
            const selectedRows = oEvent.getSource().getSelectedItems()
            const selectedItems = selectedRows.map((row) => {
                return row.getBindingContext().getObject();
            });

            this._setModel(selectedItems, "SelectedRowsModel");
            console.log("SelectedRowsModel ::", this._getModel("SelectedRowsModel").getData())
        },

        managerQtyDraft: function () {
            let that = this
            let input = new sap.m.Input()
            let dialog = new sap.m.Dialog({
                title: "Entrez la Quantité",
                content: input,
                endButton: new sap.m.Button({
                    text: "Valider",
                    press: function () {
                        const qtyEntered = input.getValue()
                        if (qtyEntered <= 0 || !qtyEntered) {
                            MessageBox.error("Quantité non valide")
                        } else {
                            const draftData = that._getModel("draftModel").getData()
                            draftData.qtyEntered = qtyEntered
                            console.log("qtyEntered ::", qtyEntered)
                            that.dialogListPurchaseOrder()
                            dialog.close()
                        }
                    }
                })
            })
            dialog.open()
        },

        managerDrafts: async function (draftExist) {
            let that = this
            const draftModel = that._getModel("draftModel")
            const draftData = that._getModel("draftModel").getData()

            let qtyEntered = draftData.qtyEntered
            const selectedOrdersData = that._getModel("SelectedRowsModel").getData()

            async function linkOrderQuantitiesToDraft(qtyEntered, selectedOrdersData, itemCode) {
                let dataToPatch = {DocumentLines: []}
                let currentTotalOrderQuantities = 0
                for (const order of selectedOrdersData) {
                    if (currentTotalOrderQuantities >= qtyEntered) break
                    const remainingQty = qtyEntered - currentTotalOrderQuantities
                    const addedQty = Math.min(order.RemainingQty, remainingQty)
                    const itemCode = that._getModel("draftModel").getData().selectedItemCode
                    dataToPatch.DocumentLines.push({
                        ItemCode: itemCode,
                        Quantity: addedQty,
                        BaseLine: order.LineNum,
                        BaseEntry: order.DocEntry,
                        BaseType: 22,
                    })
                    currentTotalOrderQuantities += addedQty
                }
                if (currentTotalOrderQuantities < qtyEntered) dataToPatch.DocumentLines.push({
                    ItemCode: draftData.selectedItemCode,
                    Quantity: qtyEntered - currentTotalOrderQuantities,
                })
                console.log("dataToPatch ::", dataToPatch)
                if (!draftData.draftExist) {
                    //POST
                    let responsePostDraft = await Models.Drafts().post({
                        CardCode: draftData.CardCode,
                        DocDueDate: new Date(),
                        DocObjectCode: "oPurchaseDeliveryNotes",
                        DocumentLines: dataToPatch
                    })
                    console.log("responsePostDraft ::", responsePostDraft)
                    draftData.draftExist = true
                    draftData.currentDraft = responsePostDraft
                    that.refreshDraftPage()
                    console.log("draftModel ::", draftModel.getData())
                } else {
                    //PATCH: Mettre à jour le brouillon existant
                    const currentDraftLines = draftData.currentDraft.DocumentLines;
                    const highestLineNum = currentDraftLines.length ? Math.max(...currentDraftLines.map(line => line.LineNum)) : 0;
                    // Ajouter LineNum à chaque nouvelle ligne dans dataToPatch
                    dataToPatch.DocumentLines.forEach((line, index) => {
                        line.LineNum = highestLineNum + index + 1;
                    });
                    //Revoir le refresh
                    console.log("highest line num :: ", highestLineNum)
                    draftData.currentDraft.DocumentLines.LineNum = highestLineNum + 1
                    // Fusionner les nouvelles lignes avec les lignes existantes
                    const mergedLines = currentDraftLines.concat(dataToPatch.DocumentLines);

                    const y = await Models.Drafts().patch({DocumentLines:mergedLines}, draftData.currentDraft.DocEntry)
                    console.log("draftData with lineNUm:",draftData)
                    that._getModel("draftModel").getData()
                    //refresh
                    draftData.currentDraft.DocumentLines = mergedLines;
                    that.refreshDraftPage()
                }
            }

            linkOrderQuantitiesToDraft(qtyEntered, selectedOrdersData)
            this.refreshDraftPage()
        },

        refreshDraftPage: function () {
            this._getModel("draftModel").refresh(true)
        },

        onPressAddItem: function () {
            let inputCodeBar = new sap.m.Input({
                placeholder: "code bar"
            });

            let HboxinputCodeBar = new sap.m.HBox({
                items: [inputCodeBar],
                alignItems: "Center"
            }).addStyleClass("sapUiSmallMargin");

            let dialog = new sap.m.Dialog({
                title: "Code bar",
                content: [HboxinputCodeBar],
                beginButton: new sap.m.Button({
                    text: "Valider",
                    press: async () => {
                        let scannedCode = inputCodeBar.getValue();
                        const listOfItemWitCodeBars = await Models.Items().filter(`Frozen ne 'Y' and contains(BarCode,'${scannedCode}')`).get()
                        const draftData = this._getModel("draftModel").getData()
                        draftData.selectedItemCode = listOfItemWitCodeBars.value[0].ItemCode
                        console.log("itemCode ::", draftData.selectedItemCode)
                        if (!draftData.selectedItemCode) {
                            new sap.m.MessageBox.error("Aucun code barre correspondant")
                        } else {
                            // this._getModel("listOfItemWithCodeBarsModel").refresh(true);
                            const CardCode = draftData.CardCode
                            this.managerQtyDraft()
                        }
                        console.log("Scanned code: ", scannedCode);
                        console.log("itemCode ::", draftData.selectedItemCode)
                        dialog.close()
                    }
                }),
                endButton: new sap.m.Button({
                    text: "Fermer",
                    press: function () {
                        dialog.close();
                    }
                })
            });
            this.getView().addDependent(dialog);
            dialog.open();
        },


        // dialogRedirection: async function () {
        //     let that = this
        //     let dialog = new sap.m.Dialog({
        //         title: "Continuer la reception",
        //         contentWidth: "300px",
        //         beginButton: new sap.m.Button({
        //             text: "Non", press: function () {
        //                 that.getOwnerComponent().getRouter().navTo("ReceptionSelectBusinessPartnersPage")
        //                 //changer le status du draft en terminé
        //                 dialog.close()
        //             }
        //         }),
        //         endButton: new sap.m.Button({
        //             text: "Oui",
        //             press: function () {
        //                 const CardCode = that._getModel("CardCodeModelSL").getData().CardCode
        //                 const DocEntry = that._getModel("DocEntryModelSL")?.getData().DocEntry
        //                 let input = new sap.m.Input()
        //                 let dialog = new sap.m.Dialog({
        //                     title: "Scanner l'article",
        //                     content: input,
        //                     contentWidth: "300px",
        //                     endButton: new sap.m.Button({
        //                         text: "Valider", press: function () {
        //                             that.purchaseOrdersList(input.getValue(), CardCode)
        //                             that._setModel(DocEntry, "DocEntryModelSL")
        //                             dialog.close()
        //                         }
        //                     })
        //                 })
        //                 dialog.close()
        //             }
        //         })
        //     })
        //     dialog.open()
        // },


    });
});
