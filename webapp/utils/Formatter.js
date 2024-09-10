sap.ui.define([
    "wwl/model/models",

], function (models) {
    "use strict";
    return {

        formatDate:function (DocDueDate) {
            if(!DocDueDate){
                return null
            }
            return new Date(DocDueDate).toLocaleDateString('fr-FR')
        },
    }
});