sap.ui.define([
    "sap/ui/base/ManagedObject",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",

], function (
    ManagedObject,
    MessageBox,
    Fragment
) {
    "use strict";
    return ManagedObject.extend('wwl.model.BaseModel', {

        oView: "",
        target: "",
        appContext: "",
        query: "",
        busyDialog: "",

        getError: function (e) {
            if (e.stack) {
                e = e.stack.split("\n");
                e = e.join('\n"');
            } else if (e.responseJSON) {
                e = e.responseJSON.error.message.value
            }
            return e
        },

        _prepareToAddParam: function () {
            return this.query === "" ? "?$" : "&$";
        },

        select: function (select) {
            this.query += this._prepareToAddParam();
            this.query += `select=${select}`;
            return this
        },

        apply: function (apply) {
            this.query += this._prepareToAddParam();
            this.query += `apply=${apply}`;
            return this
        },

        filter: function (filter) {
            this.query += this._prepareToAddParam();
            this.query += `filter=${filter}`;
            return this
        },


        orderby: function (orderby) {
            this.query += this._prepareToAddParam();
            this.query += `orderby=${orderby}`;
            return this
        },

        top: function (top) {
            this.query += this._prepareToAddParam();
            this.query += `top=${top}`;
            return this
        },

        id: function (id) {
            this.query = `(${id})${this.query}`;
            return this
        },

        _resetQuery: function () {
            this.query = ""
        },

        format: function () {
            this.query += this._prepareToAddParam();
            this.query += "format=json";
            return this
        },

        handleAuth: function () {
            let that = this
            console.log("cookie B1SESSION n'existe pas :", !that.getCookie("B1SESSION"))
            return new Promise((resolve, reject) => {
                if (!that.getCookie("B1SESSION") && that.appContext.authRequired) {
                    console.log("besoin d'auth")
                    if (!this._oDialogAuth) {
                        let authModel = {"username": "", "password": "", "company": that.appContext.dbCompany}
                        this._oDialogAuth = Fragment.load({
                            id: that.oView.getId(),
                            name: "wwl.view.Authentication",
                            controller: this
                        }).then(function (Dialog) {
                            that.oView.addDependent(Dialog)
                            Dialog.attachAfterClose(() => {
                                console.log("dans attachAfterClose")
                                resolve("afterCloseDialog")
                            })
                            return Dialog;
                        });
                        this._oDialogAuth.then(function (oDialog) {
                            oDialog.open();
                        });
                        that.oView.setModel(new sap.ui.model.json.JSONModel(authModel), "authModel");
                    }

                    /** IF AUTO AUTH NEEDED**/
                } else if (!that.getCookie("B1SESSION") && !that.appContext.authRequired) {
                    console.log("auto auth requise")
                    let login = that.oView.getModel("conf").getResourceBundle().getText('login');
                    let pass = that.oView.getModel("conf").getResourceBundle().getText('pass');

                    this.login(login, pass).done(() => {
                        resolve()
                    })
                } else {
                    console.log("pas besoin d'auth")
                    resolve()
                }
            })

        },

        onConnectPress: function () {
            let that = this
            let oData = that.oView.getModel("authModel").getData();
            this.login(oData.username, oData.password).done(() => {
                console.log("Connexion réussie")
                that._oDialogAuth.then((oDialog) => oDialog.close())
            }).fail((e) => MessageBox.error(that.getError(e)))
        },

        setCookie: function (cname, cvalue, exMinutes) {
            let d = new Date();
            d.setTime(d.getTime() + (exMinutes * 60 * 1000));
            let expires = "expires=" + d.toUTCString();
            document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
        },

        getCookie: function (cname) {
            let name = cname + "=";
            let ca = document.cookie.split(';');
            for (let i = 0; i < ca.length; i++) {
                let c = ca[i];
                while (c.charAt(0) == ' ') {
                    c = c.substring(1);
                }
                if (c.indexOf(name) == 0) {
                    return c.substring(name.length, c.length);
                }
            }
            return "";
        },

        login: function (login, password) {
            let that = this;

            return $.ajax({
                beforeSend: function () {
                    that.oView.setBusy(true);
                },
                async: false,
                method: "post",
                url: `${that.appContext.url.SL}Login`,
                xhrFields: {withCredentials: true},
                data: JSON.stringify({
                    UserName: login,
                    Password: password,
                    CompanyDB: that.appContext.dbCompany,
                }),
            })
                .done((data) => that.setCookie('B1SESSION', data.SessionId, data.SessionTimeout))
                .always(() => that.oView.setBusy(false))
        },

        get: async function () {
            let that = this

            await that.handleAuth()

            let qry = that.query
            that.busyDialog.setText("Récupération en cours...")
            that.busyDialog.open()
            that._resetQuery();

            return $.ajax({
                method: 'get',
                url: that.appContext.url.SL + that.target + qry,
                xhrFields: {withCredentials: true}
            })
                .fail((e) => MessageBox.error(this.getError(e)))
                .always(() => that.busyDialog.close())
        },

        post: async function (dataToPost) {
            let that = this

            await that.handleAuth()

            that.busyDialog.setText("Création en cours...")
            that.busyDialog.open()
            return $.ajax({
                method: 'post',
                url: that.appContext.url.SL + that.target,
                data: JSON.stringify(dataToPost),
                xhrFields: {withCredentials: true}
            })
                .fail((e) => MessageBox.error(this.getError(e)))
                .always(() => that.busyDialog.close())
        },

        put: async function (dataToPost, id) {
            let that = this

            await that.handleAuth()

            // B1S-ReplaceCollectionsOnPatch
            that.busyDialog.setText("Transfert en cours...")
            that.busyDialog.open()
            return $.ajax({
                method: 'put',
                url: `${that.appContext.url.SL + that.target}(${id})`,
                data: JSON.stringify(dataToPost),
                xhrFields: {withCredentials: true}
            })
                .fail((e) => MessageBox.error(this.getError(e)))
                .always(() => that.busyDialog.close())
        },

        //use patch for add or create something in anything but for delete we need patch where the ReplaceCollection past on true
        patch: async function (dataToPost, id,ReplaceCollectionsOnPatch=false) {
            let that = this
            await that.handleAuth()
            that.busyDialog.setText("Création en cours...")
            that.busyDialog.open()
            return $.ajax({
                // method: 'post',
                method: 'patch',
                url: `${that.appContext.url.SL + that.target}(${id})`,
                data: JSON.stringify(dataToPost),
                headers: {'B1S-ReplaceCollectionsOnPatch':ReplaceCollectionsOnPatch},
                xhrFields: {withCredentials: true}
            })
                .fail((e) => MessageBox.error(this.getError(e)))
                .always(() => that.busyDialog.close())
        },


        delete: async function (dataToPost, id) {
            let that = this
            await that.handleAuth()

            that.busyDialog.setText("Suppression en cours...")
            that.busyDialog.open()
            return $.ajax({
                // method: 'patch',
                method: 'delete',
                url: `${that.appContext.url.SL + that.target}(${id})`,
                data: JSON.stringify(dataToPost),
                // headers: {'X-HTTP-Method-Override': 'PATCH'},
                xhrFields: {withCredentials: true}
            })
                .fail((e) => MessageBox.error(this.getError(e)))
                .always(() => that.busyDialog.close())
        },

        close: async function (id) {
            let that = this
            await that.handleAuth()
            that.busyDialog.setText("Clôture en cours...")
            that.busyDialog.open()
            return $.ajax({
                method: 'post',
                url: `${that.appContext.url.SL + that.target}(${id})/Close`,
                xhrFields: {withCredentials: true}
            })
                .fail((e) => MessageBox.error(this.getError(e)))
                .always(() => that.busyDialog.close())
        },

        /** Pour les SQLQueries **/
        execute: async function (qryName, params = "") {
            let that = this;

            await that.handleAuth()

            that.busyDialog.setText("Requête en cours...")
            that.busyDialog.open()
            that._resetQuery();

            return $.ajax({
                method: 'get',
                url: `${that.appContext.url.SL + that.target}(${qryName})/List${params}`,
                xhrFields: {withCredentials: true}
            })
                .fail((e) => MessageBox.error(that.getError(e)))
                .always(() => that.busyDialog.close())
        },

        /**Pour la PrintAPI **/
        print: async function (dataToPost) {
            let that = this;

            await that.handleAuth()

            that.busyDialog.setText("Impression en cours...")
            that.busyDialog.open()

            return $.ajax({
                beforeSend: () => that.busyDialog.open(),
                method: "post",
                contentType: "application/json",
                url: `${that.appContext.url.PrintAPI}`,
                data: JSON.stringify(dataToPost)
            })
                .fail((e) => MessageBox.error(this.getError(e)))
                .always(() => that.busyDialog.close())
        },

        requestBySeidorAPI: async function (dataToPost) {
            let that = this;

            await that.handleAuth()

            that.busyDialog.setText("Requete en cours...")
            that.busyDialog.open()

            return $.ajax({
                beforeSend: () => that.busyDialog.open(),
                method: "post",
                contentType: "application/json",
                url: `${that.appContext.url.SeidorAPI}`,
                data: JSON.stringify(dataToPost)
            })
                .fail((e) => MessageBox.error(this.getError("Une erreur est survenue lors du post")))
                .always(() => that.busyDialog.close())
        },

        sendBLbyMail: async function (dataToPost) {
            let that = this;

            await that.handleAuth()

            that.busyDialog.setText("Envoi du BL par mail...")
            that.busyDialog.open()

            return $.ajax({
                beforeSend: () => that.busyDialog.open(),
                method: "post",
                contentType: "application/json",
                url: `${that.appContext.url.PrintAPI + that.target}/EmailPDF`,
                data: JSON.stringify(dataToPost)
            })
                .fail((e) => MessageBox.error(this.getError(e)))
                .always(() => that.busyDialog.close())
        },
    });
});