// RememberizeJS 0.2 - don't forget formdata on reload.
// Requires cookiejs and jquery for now.

const DJANGO_BLACKLIST = [
    'csrfmiddlewaretoken',
    'TOTAL_FORMS',
    'INITIAL_FORMS',
    'MIN_NUM_FORMS',
    'MAX_NUM_FORMS',
    'current_step',
]

const miniCookieLib = {
    setCookie: (name, value, days) => {
        let expires = "";
        if(days){
            let date = new Date();
            date.setTime(date.getTime() + (days*24*60*60*1000));
            expires = `; expires=${date.toUTCString()}`;
        }
        document.cookie = `${name}=` + (value || "") + `${expires}; path=/`;
    },
    getCookie: (name) => {
        let nameEQ = `${name}=`;
        let ca = document.cookie.split(';');
        for(let i=0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1,c.length);
            if (!c.indexOf(nameEQ)) return c.substring(nameEQ.length,c.length);
        }
        return null;
    },
    getAllCookies: () => {
      let pairs = document.cookie.split(";");
      let cookies = {};
      pairs.forEach((element) => {
        let item = element.split('=');
        cookies[(`${item[0]}`).trim()] = unescape(item.slice(1).join('='));
      });
      return cookies;
    },
    removeCookie: (name) => {
        document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
    }
};

const rememberize = {
    DEFAULT_EXPIRE_DAYS: 3,
    isCKeditor: (field) => {
        let ID = field.id;
        let checkCKeditor = document.querySelectorAll(`#cke_${ID}`);
        return !!checkCKeditor.length;
    },
    cleanFields: function (form) {
        let inputs = form.find('input, select');
        return inputs.filter(function () {
            let curr = this;
            let result = true;
            let name = curr.getAttribute('name');
            DJANGO_BLACKLIST.forEach((entry) => {
                if (name && name.endsWith(entry)) result = false;
            });
            return result;
        });
    },
    saveTextareas: function (form) {
        const self = this;
        let textareas = form.querySelectorAll('textarea');
        textareas.forEach((item) => {
            let val;
            if (self.isCKeditor(item)) val = CKEDITOR.instances[item.id].getData();
            else val = item.value;
            miniCookieLib.setCookie(
                `rememberize[textarea]-${item.id}`,
                val, item.DEFAULT_EXPIRE_DAYS,
            );
        });
    },
    saveToCookie: function (form) {
        miniCookieLib.setCookie(
            `rememberize-${form.attr('id')}`,
            this.cleanFields(form).serialize(),
            this.DEFAULT_EXPIRE_DAYS,
        );
        this.saveTextareas(form);
    },
    initEvent: function (form) {
        const self = this;
        console.log(form)
        form.querySelectorAll('input, select').forEach((elem) => {
            elem.addEventListener('change', () => {
                self.saveToCookie(form);
            }, false);
        });
        form.querySelectorAll('textarea').forEach((elem) => {
            if (self.isCKeditor(elem)) {
                CKEDITOR.instances[elem.id].addEventListener('change', () => {
                    self.saveTextareas(form);
                }, false);
            } else elem.addEventListener('change', () => {
                self.saveTextareas(form);
            })
        })
    },
    execute: function (selector) {
        let self = this;
        selector.forEach((element) => {
            if(element.id) self.initEvent(element);
        });
    },
    loadToForm: function (id, serializedData) {
        $.each(serializedData.split('&'), (index, elem) => {
            let vals = elem.split('=');
            let field = document.querySelectorAll(`#${id} [name='${vals[0]}']`)[0];
            let value = decodeURIComponent(vals[1].replace(/\+/g, ' '));
            if (field && field.tagName === 'checkbox') {
                field.filter(function () {
                    return this.value === value
                }).prop('checked', true);
            } else if(field) field.value = value;
        });
    },
    formalize: function () {
        let self = this;
        let allCookies = miniCookieLib.getAllCookies();
        Object.keys(allCookies).forEach(key => {
            if (key.startsWith('rememberize-')) {
                this.loadToForm(key.replace('rememberize-', ''), allCookies[key])
            } else if (key.startsWith('rememberize[textarea]-')) {
                let selector = $(`#${key.replace('rememberize[textarea]-', '')}`);
                if (self.isCKeditor(selector)) CKEDITOR.instances[selector.attr('id')].setData(allCookies[key]);
                else selector.value = allCookies[key];
            }
        })
    },
    cleanUp: function () {
        Object.keys(miniCookieLib.getAllCookies()).forEach(key => {
            key.startsWith('rememberize') && miniCookieLib.removeCookie(key);
        });
    },
    overallInit: function (selector) {
        this.execute(selector);
        this.formalize();
    }
}